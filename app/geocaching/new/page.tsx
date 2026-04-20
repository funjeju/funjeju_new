'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/hooks/useAuth';
import { useGPS } from '@/hooks/useGPS';
import {
  CacheType, CacheSize, GiftType, CacheWaypoint,
  ChallengeRequirement,
} from '@/types';
import Link from 'next/link';

const TYPE_OPTIONS: { value: CacheType; icon: string; label: string; desc: string }[] = [
  { value: 'traditional', icon: '📦', label: '전통', desc: '좌표에 실제 캐시 용기가 있어요' },
  { value: 'multi',       icon: '🔗', label: '멀티', desc: '여러 지점을 순서대로 방문해요' },
  { value: 'mystery',     icon: '❓', label: '수수께끼', desc: '퍼즐을 풀어 실제 좌표를 얻어요' },
  { value: 'virtual',     icon: '👁', label: '가상', desc: '용기 없이 현장 질문으로 인증해요' },
  { value: 'earthcache',  icon: '🌍', label: '자연', desc: '지질·자연 학습 후 인증해요' },
  { value: 'challenge',   icon: '🏆', label: '챌린지', desc: '특정 조건 충족 후 인증 가능해요' },
];

const SIZE_OPTIONS: { value: CacheSize; label: string; desc: string }[] = [
  { value: 'nano',    label: '극소 (Nano)',    desc: '자석 캡슐 크기' },
  { value: 'micro',   label: '소형 (Micro)',   desc: '필름통 크기' },
  { value: 'small',   label: '중소형 (Small)', desc: '샌드위치백 크기' },
  { value: 'regular', label: '보통 (Regular)', desc: '반찬통 크기' },
  { value: 'large',   label: '대형 (Large)',   desc: '큰 양동이 이상' },
  { value: 'virtual', label: '가상 (Virtual)', desc: '용기 없음' },
  { value: 'other',   label: '기타 (Other)',   desc: '기타' },
];

const CHALLENGE_TYPES: { value: ChallengeRequirement['type']; label: string }[] = [
  { value: 'cache_count',    label: 'N개 캐시 발견' },
  { value: 'stamp_count',    label: 'N개 오름 스탬프' },
  { value: 'mission_count',  label: 'N개 미션 완료' },
  { value: 'specific_caches', label: '특정 캐시 목록 발견' },
  { value: 'region_caches',  label: '특정 지역 캐시 발견' },
];

// 난이도 선택 컴포넌트
function RatingPicker({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  const steps = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];
  return (
    <div>
      <label className="text-sm font-medium text-[#1A2F4B] block mb-2">
        {label} <span className="text-[#0EA5A0] font-bold">{value.toFixed(1)}</span>
      </label>
      <div className="flex gap-1 flex-wrap">
        {steps.map(s => (
          <button key={s} onClick={() => onChange(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              value === s ? 'bg-[#0EA5A0] text-white border-[#0EA5A0]' : 'bg-white text-[#64748B] border-[#E2E8F0]'
            }`}>
            {s.toFixed(1)}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function NewCachePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { position } = useGPS(false);

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // 기본 필드
  const [cacheType, setCacheType] = useState<CacheType>('traditional');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [size, setSize] = useState<CacheSize>('regular');
  const [difficulty, setDifficulty] = useState(2);
  const [terrain, setTerrain] = useState(2);
  const [region, setRegion] = useState('');
  const [tags, setTags] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [radiusMeters, setRadiusMeters] = useState(30);

  // 힌트
  const [hintText, setHintText] = useState('');

  // 선물
  const [hasGift, setHasGift] = useState(false);
  const [giftType, setGiftType] = useState<GiftType>('physical');
  const [giftDescription, setGiftDescription] = useState('');
  const [giftPoints, setGiftPoints] = useState(100);

  // 연계
  const [linkedOreumId, setLinkedOreumId] = useState('');
  const [linkedMissionId, setLinkedMissionId] = useState('');

  // 멀티 웨이포인트
  const [waypoints, setWaypoints] = useState<CacheWaypoint[]>([
    { order: 1, label: '웨이포인트 1', description: '', lat: 0, lng: 0, radiusMeters: 30, clue: '' },
  ]);

  // 챌린지 조건
  const [challengeType, setChallengeType] = useState<ChallengeRequirement['type']>('cache_count');
  const [challengeCount, setChallengeCount] = useState(10);
  const [challengeDescription, setChallengeDescription] = useState('');

  useEffect(() => {
    if (position) {
      setLat(position.lat.toFixed(6));
      setLng(position.lng.toFixed(6));
    }
  }, [position]);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/auth');
  }, [user, authLoading, router]);

  function addWaypoint() {
    setWaypoints(prev => [
      ...prev,
      { order: prev.length + 1, label: `웨이포인트 ${prev.length + 1}`, description: '', lat: 0, lng: 0, radiusMeters: 30, clue: '' },
    ]);
  }

  function updateWaypoint(idx: number, field: keyof CacheWaypoint, value: string | number) {
    setWaypoints(prev => prev.map((wp, i) => i === idx ? { ...wp, [field]: value } : wp));
  }

  function useCurrentGPS(idx?: number) {
    if (!position) return;
    if (idx === undefined) {
      setLat(position.lat.toFixed(6));
      setLng(position.lng.toFixed(6));
    } else {
      updateWaypoint(idx, 'lat', position.lat);
      updateWaypoint(idx, 'lng', position.lng);
    }
  }

  async function handleSubmit() {
    if (!user || !title.trim() || !lat || !lng) return;
    setSubmitting(true);

    const data: Omit<any, 'id'> = {
      title: title.trim(),
      description: description.trim(),
      type: cacheType,
      difficulty,
      terrain,
      size,
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      radiusMeters,
      region: region.trim(),
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      hintText: hintText.trim() || null,
      hintPhotos: [],
      hasGift,
      gift: hasGift ? {
        type: giftType,
        description: giftDescription.trim(),
        points: giftType === 'points' ? giftPoints : null,
      } : null,
      waypoints: cacheType === 'multi' ? waypoints : [],
      challengeRequirement: cacheType === 'challenge' ? {
        type: challengeType,
        count: challengeCount,
        description: challengeDescription.trim(),
      } : null,
      linkedOreumId: linkedOreumId.trim() || null,
      linkedMissionId: linkedMissionId.trim() || null,
      trackableIds: [],
      foundCount: 0,
      dnfCount: 0,
      favoriteCount: 0,
      createdBy: user.uid,
      createdByName: user.displayName ?? '익명',
      isPublished: false, // 관리자 승인 후 발행
      isActive: true,
      isArchived: false,
      createdAt: serverTimestamp(),
    };

    const ref = await addDoc(collection(db, 'geocaches'), data);
    router.push(`/geocaching/${ref.id}`);
  }

  if (authLoading) return null;

  const steps = ['기본 정보', '위치·난이도', '힌트·선물', '연계·제출'];

  return (
    <div className="max-w-lg mx-auto px-4 py-4 space-y-4 pb-8">
      {/* 상단 */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-[#64748B] text-sm">←</button>
        <h1 className="text-lg font-bold text-[#1A2F4B]">새 캐시 등록</h1>
      </div>

      {/* 스텝 인디케이터 */}
      <div className="flex items-center gap-1">
        {steps.map((s, i) => (
          <div key={i} className="flex-1 flex items-center">
            <button
              onClick={() => i + 1 < step && setStep(i + 1)}
              className={`w-full text-center py-1.5 rounded-lg text-xs font-medium transition-colors ${
                step === i + 1 ? 'bg-[#0EA5A0] text-white'
                : step > i + 1 ? 'bg-[#E0F7F6] text-[#0EA5A0]'
                : 'bg-[#F8FAFC] text-[#94A3B8]'
              }`}
            >
              {step > i + 1 ? '✓' : i + 1} {s}
            </button>
            {i < steps.length - 1 && <div className="w-1 h-px bg-[#E2E8F0] mx-0.5" />}
          </div>
        ))}
      </div>

      {/* STEP 1: 기본 정보 */}
      {step === 1 && (
        <div className="space-y-4">
          {/* 캐시 타입 */}
          <div>
            <label className="text-sm font-medium text-[#1A2F4B] block mb-2">캐시 유형 *</label>
            <div className="grid grid-cols-2 gap-2">
              {TYPE_OPTIONS.map(opt => (
                <button key={opt.value} onClick={() => setCacheType(opt.value)}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    cacheType === opt.value ? 'border-[#0EA5A0] bg-[#E0F7F6]' : 'border-[#E2E8F0] bg-white'
                  }`}>
                  <p className="text-xl mb-1">{opt.icon}</p>
                  <p className="text-xs font-semibold text-[#1A2F4B]">{opt.label}</p>
                  <p className="text-[10px] text-[#64748B] mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-[#1A2F4B] block mb-1">제목 *</label>
            <input value={title} onChange={e => setTitle(e.target.value)}
              placeholder="캐시 이름 (예: 협재해수욕장의 비밀)"
              className="w-full border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#0EA5A0]" />
          </div>

          <div>
            <label className="text-sm font-medium text-[#1A2F4B] block mb-1">설명 *</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              placeholder="캐시에 대한 이야기, 이 장소의 의미, 찾는 사람에게 전하는 말..."
              rows={4}
              className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm resize-none outline-none focus:border-[#0EA5A0]" />
          </div>

          <div>
            <label className="text-sm font-medium text-[#1A2F4B] block mb-1">지역</label>
            <input value={region} onChange={e => setRegion(e.target.value)}
              placeholder="예: 제주시 애월읍"
              className="w-full border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#0EA5A0]" />
          </div>

          <div>
            <label className="text-sm font-medium text-[#1A2F4B] block mb-1">태그 (쉼표 구분)</label>
            <input value={tags} onChange={e => setTags(e.target.value)}
              placeholder="해안, 오름, 숲속, 도심..."
              className="w-full border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#0EA5A0]" />
          </div>

          {/* 용기 크기 (virtual/earthcache 제외) */}
          {cacheType !== 'virtual' && cacheType !== 'earthcache' && (
            <div>
              <label className="text-sm font-medium text-[#1A2F4B] block mb-2">용기 크기 *</label>
              <div className="grid grid-cols-2 gap-2">
                {SIZE_OPTIONS.filter(s => s.value !== 'virtual').map(opt => (
                  <button key={opt.value} onClick={() => setSize(opt.value)}
                    className={`p-2.5 rounded-xl border-2 text-left transition-all ${
                      size === opt.value ? 'border-[#0EA5A0] bg-[#E0F7F6]' : 'border-[#E2E8F0] bg-white'
                    }`}>
                    <p className="text-xs font-semibold text-[#1A2F4B]">{opt.label}</p>
                    <p className="text-[10px] text-[#64748B]">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 2: 위치·난이도 */}
      {step === 2 && (
        <div className="space-y-4">
          {cacheType !== 'multi' ? (
            <>
              <div className="bg-[#F0FDF9] border border-[#0EA5A0]/30 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-[#1A2F4B]">현재 GPS 위치</p>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    {position ? `${position.lat.toFixed(5)}, ${position.lng.toFixed(5)}` : '위치 확인 중...'}
                  </p>
                </div>
                <button onClick={() => useCurrentGPS()}
                  className="px-3 py-1.5 bg-[#0EA5A0] text-white text-xs rounded-lg">
                  현위치 사용
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[#64748B] block mb-1">위도 *</label>
                  <input value={lat} onChange={e => setLat(e.target.value)} type="number" step="0.000001"
                    className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm outline-none focus:border-[#0EA5A0]" />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#64748B] block mb-1">경도 *</label>
                  <input value={lng} onChange={e => setLng(e.target.value)} type="number" step="0.000001"
                    className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm outline-none focus:border-[#0EA5A0]" />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-[#1A2F4B] block mb-1">
                  인증 반경: <span className="text-[#0EA5A0]">{radiusMeters}m</span>
                </label>
                <input type="range" min={10} max={200} step={5} value={radiusMeters}
                  onChange={e => setRadiusMeters(Number(e.target.value))}
                  className="w-full accent-[#0EA5A0]" />
                <div className="flex justify-between text-xs text-[#94A3B8]"><span>10m (정밀)</span><span>200m (넓게)</span></div>
              </div>
            </>
          ) : (
            /* 멀티캐시 웨이포인트 */
            <div className="space-y-3">
              {/* 멀티캐시도 지도 표시용 대표 좌표 필요 */}
              <div className="bg-[#F0FDF9] border border-[#0EA5A0]/30 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-[#1A2F4B]">대표 좌표 (지도 표시용)</p>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    {lat && lng ? `${lat}, ${lng}` : 'GPS 좌표 없음 — 아래 버튼으로 설정'}
                  </p>
                </div>
                <button onClick={() => useCurrentGPS()}
                  className="px-3 py-1.5 bg-[#0EA5A0] text-white text-xs rounded-lg">
                  현위치
                </button>
              </div>
              <p className="text-sm font-medium text-[#1A2F4B]">웨이포인트 설정</p>
              {waypoints.map((wp, idx) => (
                <div key={idx} className="border border-[#E2E8F0] rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#0EA5A0]">웨이포인트 {wp.order}</span>
                    <button onClick={() => useCurrentGPS(idx)}
                      className="text-xs text-[#0EA5A0] border border-[#0EA5A0] px-2 py-0.5 rounded-lg">
                      현위치
                    </button>
                  </div>
                  <input value={wp.label} onChange={e => updateWaypoint(idx, 'label', e.target.value)}
                    placeholder="웨이포인트 이름"
                    className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-xs outline-none" />
                  <input value={wp.description} onChange={e => updateWaypoint(idx, 'description', e.target.value)}
                    placeholder="이 지점에서 할 일"
                    className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-xs outline-none" />
                  <div className="grid grid-cols-2 gap-2">
                    <input value={wp.lat || ''} onChange={e => updateWaypoint(idx, 'lat', parseFloat(e.target.value) || 0)}
                      type="number" step="0.000001" placeholder="위도"
                      className="border border-[#E2E8F0] rounded-lg px-3 py-2 text-xs outline-none" />
                    <input value={wp.lng || ''} onChange={e => updateWaypoint(idx, 'lng', parseFloat(e.target.value) || 0)}
                      type="number" step="0.000001" placeholder="경도"
                      className="border border-[#E2E8F0] rounded-lg px-3 py-2 text-xs outline-none" />
                  </div>
                  <input value={wp.clue} onChange={e => updateWaypoint(idx, 'clue', e.target.value)}
                    placeholder="이 지점 완료 후 줄 단서 (선택)"
                    className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-xs outline-none" />
                </div>
              ))}
              <button onClick={addWaypoint}
                className="w-full py-2.5 border-2 border-dashed border-[#0EA5A0] text-[#0EA5A0] rounded-xl text-sm hover:bg-[#E0F7F6]">
                + 웨이포인트 추가
              </button>
            </div>
          )}

          <RatingPicker label="난이도 (캐시 찾기 어려움)" value={difficulty} onChange={setDifficulty} />
          <RatingPicker label="지형 (이동 난이도)" value={terrain} onChange={setTerrain} />

          {/* 챌린지 조건 */}
          {cacheType === 'challenge' && (
            <div className="border border-amber-200 bg-amber-50 rounded-xl p-4 space-y-3">
              <p className="text-sm font-semibold text-[#1A2F4B]">🏆 챌린지 조건 설정</p>
              <select value={challengeType} onChange={e => setChallengeType(e.target.value as ChallengeRequirement['type'])}
                className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm outline-none bg-white">
                {CHALLENGE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              {(challengeType === 'cache_count' || challengeType === 'stamp_count' || challengeType === 'mission_count') && (
                <div className="flex items-center gap-3">
                  <label className="text-sm text-[#64748B] flex-shrink-0">기준 수:</label>
                  <input type="number" min={1} value={challengeCount} onChange={e => setChallengeCount(Number(e.target.value))}
                    className="flex-1 border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm outline-none" />
                </div>
              )}
              <textarea value={challengeDescription} onChange={e => setChallengeDescription(e.target.value)}
                placeholder="조건 설명 (예: 오름 스탬프 10개를 모아야 도전 가능해요)"
                rows={2}
                className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm resize-none outline-none" />
            </div>
          )}
        </div>
      )}

      {/* STEP 3: 힌트·선물 */}
      {step === 3 && (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-[#1A2F4B] block mb-1">텍스트 힌트 (선택)</label>
            <textarea value={hintText} onChange={e => setHintText(e.target.value)}
              placeholder="힌트를 입력하세요. 저장 시 자동으로 암호화됩니다."
              rows={3}
              className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm resize-none outline-none focus:border-[#0EA5A0]" />
            <p className="text-xs text-[#94A3B8] mt-1">💡 사진 힌트는 등록 후 캐시 관리에서 추가할 수 있어요 (최대 3장)</p>
          </div>

          {/* 선물 */}
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={hasGift} onChange={e => setHasGift(e.target.checked)}
                className="w-4 h-4 accent-[#0EA5A0]" />
              <span className="text-sm font-medium text-[#1A2F4B]">🎁 캐시에 선물/보상이 있어요</span>
            </label>
          </div>

          {hasGift && (
            <div className="border border-orange-200 bg-orange-50 rounded-xl p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {(['physical', 'coupon', 'points', 'stamp'] as GiftType[]).map(t => (
                  <button key={t} onClick={() => setGiftType(t)}
                    className={`py-2 rounded-lg text-xs font-medium border transition-colors ${
                      giftType === t ? 'bg-orange-400 text-white border-orange-400' : 'bg-white text-[#64748B] border-[#E2E8F0]'
                    }`}>
                    {t === 'physical' ? '🎁 실물' : t === 'coupon' ? '🎟 쿠폰' : t === 'points' ? '⭐ 포인트' : '🌿 스탬프'}
                  </button>
                ))}
              </div>
              <textarea value={giftDescription} onChange={e => setGiftDescription(e.target.value)}
                placeholder="선물 설명 (예: 제주 특산품 스티커 3장이 들어있어요)"
                rows={2}
                className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm resize-none outline-none bg-white" />
              {giftType === 'points' && (
                <div className="flex items-center gap-3">
                  <label className="text-sm text-[#64748B]">포인트:</label>
                  <input type="number" min={1} value={giftPoints} onChange={e => setGiftPoints(Number(e.target.value))}
                    className="flex-1 border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm outline-none bg-white" />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* STEP 4: 연계·제출 */}
      {step === 4 && (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-[#1A2F4B] block mb-1">오름 연계 ID (선택)</label>
            <input value={linkedOreumId} onChange={e => setLinkedOreumId(e.target.value)}
              placeholder="오름 문서 ID"
              className="w-full border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#0EA5A0]" />
          </div>
          <div>
            <label className="text-sm font-medium text-[#1A2F4B] block mb-1">미션 연계 ID (선택)</label>
            <input value={linkedMissionId} onChange={e => setLinkedMissionId(e.target.value)}
              placeholder="미션 문서 ID"
              className="w-full border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#0EA5A0]" />
          </div>

          {/* 제출 요약 */}
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 space-y-2">
            <p className="text-sm font-semibold text-[#1A2F4B] mb-2">📋 등록 요약</p>
            {[
              ['유형', TYPE_OPTIONS.find(t => t.value === cacheType)?.label ?? ''],
              ['제목', title || '(미입력)'],
              ['위치', lat && lng ? `${lat}, ${lng}` : '(미입력)'],
              ['난이도', `${difficulty.toFixed(1)} / 지형 ${terrain.toFixed(1)}`],
              ['선물', hasGift ? giftDescription || '있음' : '없음'],
            ].map(([k, v]) => (
              <div key={k} className="flex gap-2 text-xs">
                <span className="text-[#64748B] w-14 flex-shrink-0">{k}</span>
                <span className="text-[#1A2F4B] font-medium truncate">{v}</span>
              </div>
            ))}
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
            <p className="text-xs text-amber-700">⚠️ 등록 후 관리자 승인이 완료되면 공개됩니다. 승인까지 1~2일이 소요될 수 있어요.</p>
          </div>
        </div>
      )}

      {/* 하단 버튼 */}
      <div className="flex gap-3">
        {step > 1 && (
          <button onClick={() => setStep(s => s - 1)}
            className="flex-1 py-3 border border-[#E2E8F0] rounded-xl text-sm text-[#64748B] hover:bg-[#F8FAFC]">
            이전
          </button>
        )}
        {step < 4 ? (
          <button
            onClick={() => setStep(s => s + 1)}
            disabled={step === 1 && (!title.trim() || !description.trim())}
            className="flex-1 py-3 bg-[#0EA5A0] text-white rounded-xl text-sm font-semibold disabled:opacity-40"
          >
            다음
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting || !title.trim() || !lat || !lng}
            className="flex-1 py-3 bg-[#0EA5A0] text-white rounded-xl text-sm font-semibold disabled:opacity-40"
          >
            {submitting ? '등록 중...' : '🗺 캐시 등록'}
          </button>
        )}
      </div>
    </div>
  );
}
