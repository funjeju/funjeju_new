'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  doc, getDoc, collection, getDocs, query, where, orderBy,
  addDoc, updateDoc, increment, serverTimestamp, arrayUnion, arrayRemove,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Geocache, CacheLog, CacheTrackable, LogType } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import HintPanel from '@/components/geocaching/HintPanel';
import CacheLogForm from '@/components/geocaching/CacheLogForm';
import { GPSCacheVerify, MultiCacheVerify } from '@/components/geocaching/GPSCacheVerify';
import Link from 'next/link';

const TYPE_META: Record<string, { icon: string; label: string }> = {
  traditional: { icon: '📦', label: '전통 캐시' },
  multi:        { icon: '🔗', label: '멀티 캐시' },
  mystery:      { icon: '❓', label: '수수께끼 캐시' },
  virtual:      { icon: '👁', label: '가상 캐시' },
  earthcache:   { icon: '🌍', label: '자연 캐시' },
  challenge:    { icon: '🏆', label: '챌린지 캐시' },
};

const SIZE_LABEL: Record<string, string> = {
  nano: '극소', micro: '소형', small: '중소형', regular: '보통', large: '대형', virtual: '가상', other: '기타',
};

const LOG_ICON: Record<string, string> = {
  found: '😊', dnf: '😞', note: '📝', needs_maintenance: '🔧', owner_maintenance: '⚙️',
};

// ── 별점 표시 ────────────────────────────
function StarRating({ value, label }: { value: number; label: string }) {
  const full = Math.floor(value);
  const half = value % 1 >= 0.5;
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-[#64748B] w-10">{label}</span>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(i => (
          <span key={i} className={`text-sm ${i <= full ? 'text-[#0EA5A0]' : i === full + 1 && half ? 'text-[#0EA5A0]/50' : 'text-gray-200'}`}>★</span>
        ))}
      </div>
      <span className="text-xs font-semibold text-[#1A2F4B]">{value.toFixed(1)}</span>
    </div>
  );
}

// ── 챌린지 조건 체크 ────────────────────
function ChallengeCheck({ requirement, userFoundCount, userStampCount, userMissionCount, userFoundIds }: {
  requirement: NonNullable<Geocache['challengeRequirement']>;
  userFoundCount: number;
  userStampCount: number;
  userMissionCount: number;
  userFoundIds: Set<string>;
}) {
  let met = false;
  let progress = '';

  switch (requirement.type) {
    case 'cache_count':
      met = userFoundCount >= (requirement.count ?? 0);
      progress = `${userFoundCount} / ${requirement.count} 캐시 발견`;
      break;
    case 'stamp_count':
      met = userStampCount >= (requirement.count ?? 0);
      progress = `${userStampCount} / ${requirement.count} 오름 스탬프`;
      break;
    case 'mission_count':
      met = userMissionCount >= (requirement.count ?? 0);
      progress = `${userMissionCount} / ${requirement.count} 미션 완료`;
      break;
    case 'specific_caches':
      const done = (requirement.cacheIds ?? []).filter(id => userFoundIds.has(id)).length;
      met = done === (requirement.cacheIds?.length ?? 0);
      progress = `${done} / ${requirement.cacheIds?.length ?? 0} 지정 캐시 발견`;
      break;
    case 'region_caches':
      progress = `지역: ${requirement.region}`;
      break;
  }

  return (
    <div className={`border rounded-xl p-4 ${met ? 'border-green-300 bg-green-50' : 'border-amber-200 bg-amber-50'}`}>
      <div className="flex items-center gap-2 mb-1.5">
        <span>{met ? '✅' : '⏳'}</span>
        <span className="font-semibold text-sm text-[#1A2F4B]">챌린지 조건</span>
        <span className={`ml-auto text-xs font-medium px-2 py-0.5 rounded-full ${met ? 'bg-green-200 text-green-700' : 'bg-amber-200 text-amber-700'}`}>
          {met ? '충족' : '미충족'}
        </span>
      </div>
      <p className="text-xs text-[#64748B]">{requirement.description}</p>
      <p className="text-xs font-medium text-[#1A2F4B] mt-1">{progress}</p>
    </div>
  );
}

// ── 메인 ─────────────────────────────────
export default function CacheDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  // GPS watch는 GPSCacheVerify / MultiCacheVerify 내부에서 수행 — 여기서는 불필요

  const [cache, setCache] = useState<Geocache | null>(null);
  const [logs, setLogs] = useState<CacheLog[]>([]);
  const [trackables, setTrackables] = useState<CacheTrackable[]>([]);
  const [loading, setLoading] = useState(true);
  const [alreadyFound, setAlreadyFound] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [showLogForm, setShowLogForm] = useState(false);
  const [completedWaypoints, setCompletedWaypoints] = useState<number[]>([]);

  // 챌린지용 유저 통계
  const [userFoundCount, setUserFoundCount] = useState(0);
  const [userFoundIds, setUserFoundIds] = useState<Set<string>>(new Set());
  const [userStampCount, setUserStampCount] = useState(0);
  const [userMissionCount, setUserMissionCount] = useState(0);

  useEffect(() => {
    async function load() {
      if (!id) return;

      const cacheSnap = await getDoc(doc(db, 'geocaches', id));
      if (!cacheSnap.exists()) { router.replace('/geocaching'); return; }
      const cacheData = { id: cacheSnap.id, ...cacheSnap.data() } as Geocache;
      setCache(cacheData);

      // 로그
      const logSnap = await getDocs(
        query(collection(db, 'cache_logs'), where('cacheId', '==', id), orderBy('loggedAt', 'desc'))
      );
      setLogs(logSnap.docs.map(d => ({ id: d.id, ...d.data() } as CacheLog)));

      // 트래블 아이템
      if (cacheData.trackableIds?.length) {
        const trackSnap = await getDocs(
          query(collection(db, 'cache_trackables'), where('currentCacheId', '==', id))
        );
        setTrackables(trackSnap.docs.map(d => ({ id: d.id, ...d.data() } as CacheTrackable)));
      }

      if (user) {
        // 발견 여부
        const myFoundSnap = await getDocs(
          query(collection(db, 'cache_logs'), where('cacheId', '==', id), where('uid', '==', user.uid), where('type', '==', 'found'))
        );
        setAlreadyFound(!myFoundSnap.empty);

        // 멀티캐시 진행 상태
        if (cacheData.type === 'multi') {
          const progressSnap = await getDocs(
            query(collection(db, 'cache_progress'), where('cacheId', '==', id), where('uid', '==', user.uid))
          );
          if (!progressSnap.empty) {
            setCompletedWaypoints((progressSnap.docs[0].data().completedWaypoints as number[]) ?? []);
          }
        }

        // 챌린지용 통계
        if (cacheData.type === 'challenge') {
          const allFound = await getDocs(query(collection(db, 'cache_logs'), where('uid', '==', user.uid), where('type', '==', 'found')));
          const ids = new Set(allFound.docs.map(d => (d.data() as CacheLog).cacheId));
          setUserFoundCount(ids.size);
          setUserFoundIds(ids);

          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserStampCount(data.stampCount ?? 0);
            setUserMissionCount(data.missionCompleteCount ?? 0);
          }
        }
      }

      setLoading(false);
    }
    load();
  }, [id, user, router]);

  async function handleFound() {
    if (!cache || !user) return;
    setShowLogForm(true);
  }

  async function submitLog(data: {
    type: LogType;
    comment: string;
    photoFile?: File;
    isGiftClaimed: boolean;
  }) {
    if (!cache || !user) return;
    // 이미 발견한 캐시에 found 타입 중복 제출 방지
    if (data.type === 'found' && alreadyFound) return;

    const logData = {
      cacheId: cache.id,
      cacheTitle: cache.title,
      uid: user.uid,
      userName: user.displayName ?? '익명',
      userPhotoUrl: user.photoURL ?? null,
      type: data.type,
      comment: data.comment,
      photoUrl: null,
      loggedAt: serverTimestamp(),
      isGiftClaimed: data.isGiftClaimed,
    };

    await addDoc(collection(db, 'cache_logs'), logData);

    if (data.type === 'found') {
      await updateDoc(doc(db, 'geocaches', cache.id), { foundCount: increment(1), lastFoundAt: serverTimestamp() });
      await updateDoc(doc(db, 'users', user.uid), { 'geocacheStats.cachesFound': increment(1) });
      setAlreadyFound(true);
    }

    setShowLogForm(false);
    // 로그 목록 갱신
    const logSnap = await getDocs(
      query(collection(db, 'cache_logs'), where('cacheId', '==', cache.id), orderBy('loggedAt', 'desc'))
    );
    setLogs(logSnap.docs.map(d => ({ id: d.id, ...d.data() } as CacheLog)));
  }

  async function handleWaypointVerify(order: number) {
    if (!cache || !user) return;
    const next = [...completedWaypoints, order];
    setCompletedWaypoints(next);

    // Firestore에 진행 상태 저장
    const progressRef = collection(db, 'cache_progress');
    const existing = await getDocs(query(progressRef, where('cacheId', '==', cache.id), where('uid', '==', user.uid)));
    if (existing.empty) {
      await addDoc(progressRef, { cacheId: cache.id, uid: user.uid, completedWaypoints: next, updatedAt: serverTimestamp() });
    } else {
      await updateDoc(existing.docs[0].ref, { completedWaypoints: next, updatedAt: serverTimestamp() });
    }

    // 마지막 웨이포인트 완료 → 발견 처리
    if (cache.waypoints && next.length === cache.waypoints.length) {
      setShowLogForm(true);
    }
  }

  async function toggleFavorite() {
    if (!cache || !user) return;
    const nextFav = !isFavorited;
    setIsFavorited(nextFav);
    await updateDoc(doc(db, 'geocaches', cache.id), {
      favoriteCount: increment(nextFav ? 1 : -1),
    });
    await updateDoc(doc(db, 'users', user.uid), {
      'geocacheStats.favoritePointsGiven': increment(nextFav ? 1 : -1),
      favoriteCacheIds: nextFav ? arrayUnion(cache.id) : arrayRemove(cache.id),
    });
  }

  if (loading) return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-4">
      {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)}
    </div>
  );

  if (!cache) return null;

  const meta = TYPE_META[cache.type] ?? TYPE_META.traditional;
  const isChallengeMet = cache.type !== 'challenge' || (
    cache.challengeRequirement && (() => {
      const r = cache.challengeRequirement!;
      if (r.type === 'cache_count') return userFoundCount >= (r.count ?? 0);
      if (r.type === 'stamp_count') return userStampCount >= (r.count ?? 0);
      if (r.type === 'mission_count') return userMissionCount >= (r.count ?? 0);
      if (r.type === 'specific_caches') return (r.cacheIds ?? []).every(cid => userFoundIds.has(cid));
      return false;
    })()
  );

  return (
    <div className="max-w-lg mx-auto px-4 py-4 space-y-4 pb-8">
      {/* 뒤로 + 즐겨찾기 */}
      <div className="flex items-center justify-between">
        <button onClick={() => router.back()} className="text-[#64748B] text-sm flex items-center gap-1">
          ← 목록
        </button>
        <button
          onClick={toggleFavorite}
          disabled={!user}
          className={`px-3 py-1.5 rounded-xl border text-sm transition-colors ${
            isFavorited ? 'bg-yellow-50 border-yellow-300 text-yellow-600' : 'border-[#E2E8F0] text-[#64748B]'
          }`}
        >
          {isFavorited ? '⭐ 즐겨찾기' : '☆ 즐겨찾기'} {cache.favoriteCount}
        </button>
      </div>

      {/* 타이틀 카드 */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5">
        <div className="flex items-start gap-3 mb-4">
          <span className="text-3xl">{meta.icon}</span>
          <div>
            <h1 className="text-lg font-bold text-[#1A2F4B]">{cache.title}</h1>
            <p className="text-xs text-[#64748B] mt-0.5">{meta.label} · {cache.region}</p>
          </div>
          {alreadyFound && (
            <span className="ml-auto text-xs bg-[#0EA5A0] text-white px-2 py-1 rounded-full font-medium">✅ 발견</span>
          )}
        </div>

        <p className="text-sm text-[#64748B] leading-relaxed mb-4">{cache.description}</p>

        {/* 별점 */}
        <div className="space-y-1.5 mb-4">
          <StarRating value={cache.difficulty} label="난이도" />
          <StarRating value={cache.terrain} label="지형" />
        </div>

        {/* 뱃지 */}
        <div className="flex flex-wrap gap-1.5">
          <span className="text-xs bg-[#F1F5F9] text-[#64748B] px-2 py-0.5 rounded-full">
            📦 {SIZE_LABEL[cache.size]}
          </span>
          {cache.hasGift && (
            <span className="text-xs bg-[#FFF7ED] text-orange-600 px-2 py-0.5 rounded-full">🎁 선물있음</span>
          )}
          {cache.linkedOreumId && (
            <Link href={`/oreums/${cache.linkedOreumId}`}
              className="text-xs bg-[#E0F7F6] text-[#0EA5A0] px-2 py-0.5 rounded-full hover:underline">
              🌿 오름 연계
            </Link>
          )}
          {cache.linkedMissionId && (
            <Link href={`/missions/${cache.linkedMissionId}`}
              className="text-xs bg-[#FEF3C7] text-amber-700 px-2 py-0.5 rounded-full hover:underline">
              🎯 미션 연계
            </Link>
          )}
          {cache.tags.map(t => (
            <span key={t} className="text-xs bg-[#F8FAFC] text-[#64748B] px-2 py-0.5 rounded-full">#{t}</span>
          ))}
        </div>
      </div>

      {/* 선물 정보 */}
      {cache.hasGift && cache.gift && (
        <div className="bg-[#FFF7ED] border border-orange-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">🎁</span>
            <span className="font-semibold text-[#1A2F4B] text-sm">숨겨진 선물</span>
          </div>
          <p className="text-sm text-[#64748B]">{cache.gift.description}</p>
          {cache.gift.type === 'points' && cache.gift.points && (
            <p className="text-sm font-bold text-orange-600 mt-1">⭐ {cache.gift.points} 포인트</p>
          )}
        </div>
      )}

      {/* 챌린지 조건 */}
      {cache.type === 'challenge' && cache.challengeRequirement && (
        <ChallengeCheck
          requirement={cache.challengeRequirement}
          userFoundCount={userFoundCount}
          userStampCount={userStampCount}
          userMissionCount={userMissionCount}
          userFoundIds={userFoundIds}
        />
      )}

      {/* 힌트 */}
      <HintPanel hintText={cache.hintText} hintPhotos={cache.hintPhotos ?? []} />

      {/* GPS 인증 */}
      {user && !showLogForm && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4">
          <p className="text-sm font-semibold text-[#1A2F4B] mb-3">📡 GPS 위치 인증</p>
          {cache.type === 'multi' && cache.waypoints ? (
            <MultiCacheVerify
              waypoints={cache.waypoints}
              completedWaypoints={completedWaypoints}
              onWaypointVerify={handleWaypointVerify}
              disabled={!isChallengeMet}
            />
          ) : (
            <GPSCacheVerify
              targetLat={cache.lat}
              targetLng={cache.lng}
              radiusMeters={cache.radiusMeters ?? 30}
              onVerify={handleFound}
              disabled={!isChallengeMet}
              alreadyFound={alreadyFound}
            />
          )}
          {!isChallengeMet && (
            <p className="text-xs text-amber-600 mt-2 text-center">⚠️ 챌린지 조건을 먼저 충족해야 인증할 수 있어요</p>
          )}
        </div>
      )}

      {!user && (
        <div className="bg-[#F0FDF9] border border-[#0EA5A0]/30 rounded-2xl p-4 text-center">
          <p className="text-sm text-[#1A2F4B] mb-2">로그인하면 발견 기록을 남길 수 있어요</p>
          <Link href="/auth" className="inline-block px-6 py-2 bg-[#0EA5A0] text-white text-sm font-medium rounded-xl">
            로그인
          </Link>
        </div>
      )}

      {/* 로그 작성 폼 */}
      {showLogForm && (
        <CacheLogForm
          cacheId={cache.id}
          hasGift={cache.hasGift}
          onSubmit={submitLog}
          onCancel={() => setShowLogForm(false)}
        />
      )}

      {/* 트래블 아이템 */}
      {trackables.length > 0 && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E2E8F0] flex items-center gap-2">
            <span>🐛</span>
            <span className="font-semibold text-sm text-[#1A2F4B]">이 캐시의 트래블 아이템</span>
          </div>
          <div className="divide-y divide-[#E2E8F0]">
            {trackables.map(t => (
              <div key={t.id} className="px-4 py-3">
                <p className="text-sm font-medium text-[#1A2F4B]">{t.name}</p>
                <p className="text-xs text-[#64748B] mt-0.5">{t.goal}</p>
                <p className="text-xs text-[#94A3B8] mt-0.5">
                  {t.visitedCacheCount}개 캐시 방문 · {t.totalDistanceKm.toFixed(1)}km 이동
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 로그 목록 */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[#E2E8F0] flex items-center justify-between">
          <span className="font-semibold text-sm text-[#1A2F4B]">📋 방문 로그</span>
          <span className="text-xs text-[#64748B]">{logs.length}건</span>
        </div>
        {logs.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-[#64748B]">
            아직 로그가 없어요. 첫 발견자가 되어보세요!
          </div>
        ) : (
          <div className="divide-y divide-[#E2E8F0]">
            {logs.map(log => (
              <div key={log.id} className="px-4 py-3">
                <div className="flex items-center gap-2 mb-1">
                  <span>{LOG_ICON[log.type] ?? '📝'}</span>
                  <span className="text-sm font-medium text-[#1A2F4B]">{log.userName}</span>
                  <span className="ml-auto text-xs text-[#94A3B8]">
                    {log.loggedAt?.seconds
                      ? new Date(log.loggedAt.seconds * 1000).toLocaleDateString('ko-KR')
                      : ''}
                  </span>
                </div>
                <p className="text-xs text-[#64748B] leading-relaxed">{log.comment}</p>
                {log.isGiftClaimed && (
                  <p className="text-xs text-orange-500 mt-1">🎁 선물을 가져갔어요</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
