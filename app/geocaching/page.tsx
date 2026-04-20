'use client';

import { useEffect, useState, useMemo } from 'react';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Geocache, CacheLog } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useGPS } from '@/hooks/useGPS';
import { getDistanceMeters } from '@/lib/utils/gps';
import GeocacheCard from '@/components/geocaching/GeocacheCard';
import Link from 'next/link';

// ── 필터 상수 ─────────────────────────────
const TYPE_FILTERS = [
  { key: 'all',         label: '전체' },
  { key: 'traditional', label: '📦 전통' },
  { key: 'multi',       label: '🔗 멀티' },
  { key: 'mystery',     label: '❓ 수수께끼' },
  { key: 'virtual',     label: '👁 가상' },
  { key: 'earthcache',  label: '🌍 자연' },
  { key: 'challenge',   label: '🏆 챌린지' },
];

const SORT_OPTIONS = [
  { key: 'distance', label: '거리순' },
  { key: 'newest',   label: '최신순' },
  { key: 'found',    label: '인기순' },
  { key: 'favorite', label: '즐겨찾기' },
];

// ── 통계 배너 ─────────────────────────────
function StatsBanner({ caches, foundIds }: { caches: Geocache[]; foundIds: Set<string> }) {
  const total = caches.length;
  const found = foundIds.size;
  const pct = total ? Math.round((found / total) * 100) : 0;

  return (
    <div className="bg-gradient-to-r from-[#0EA5A0] to-[#0D7A76] rounded-2xl p-4 text-white">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs opacity-70">제주 지오캐싱</p>
          <p className="text-lg font-bold">{found} / {total} 발견</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold">{pct}%</p>
          <p className="text-xs opacity-70">달성률</p>
        </div>
      </div>
      <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
        <div className="h-full bg-white rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ── 메인 ─────────────────────────────────
export default function GeocachingPage() {
  const { user } = useAuth();
  const { position } = useGPS(false);

  const [caches, setCaches] = useState<Geocache[]>([]);
  const [foundIds, setFoundIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const [typeFilter, setTypeFilter] = useState('all');
  const [sortKey, setSortKey] = useState('distance');
  const [searchQ, setSearchQ] = useState('');
  const [giftOnly, setGiftOnly] = useState(false);
  const [nearbyOnly, setNearbyOnly] = useState(false);

  useEffect(() => {
    async function load() {
      const snap = await getDocs(
        query(collection(db, 'geocaches'), where('isPublished', '==', true), where('isActive', '==', true))
      );
      setCaches(snap.docs.map(d => ({ id: d.id, ...d.data() } as Geocache)));

      if (user) {
        const logSnap = await getDocs(
          query(collection(db, 'cache_logs'), where('uid', '==', user.uid), where('type', '==', 'found'))
        );
        setFoundIds(new Set(logSnap.docs.map(d => (d.data() as CacheLog).cacheId)));
      }
      setLoading(false);
    }
    load();
  }, [user]);

  const filtered = useMemo(() => {
    let list = [...caches];

    if (typeFilter !== 'all') list = list.filter(c => c.type === typeFilter);
    if (giftOnly) list = list.filter(c => c.hasGift);
    if (nearbyOnly && position) {
      list = list.filter(c => getDistanceMeters(position.lat, position.lng, c.lat, c.lng) <= 3000);
    }
    if (searchQ.trim()) {
      const q = searchQ.toLowerCase();
      list = list.filter(c =>
        c.title.toLowerCase().includes(q) ||
        c.region.toLowerCase().includes(q) ||
        c.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    list.sort((a, b) => {
      if (sortKey === 'distance' && position) {
        return getDistanceMeters(position.lat, position.lng, a.lat, a.lng)
          - getDistanceMeters(position.lat, position.lng, b.lat, b.lng);
      }
      if (sortKey === 'found')    return b.foundCount - a.foundCount;
      if (sortKey === 'favorite') return b.favoriteCount - a.favoriteCount;
      // newest: createdAt desc
      return (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0);
    });

    return list;
  }, [caches, typeFilter, giftOnly, nearbyOnly, searchQ, sortKey, position]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1A2F4B]">🗺 제주 지오캐싱</h1>
          <p className="text-xs text-[#64748B] mt-0.5">GPS로 숨겨진 보물을 찾아보세요</p>
        </div>
        {user && (
          <Link
            href="/geocaching/new"
            className="px-4 py-2 bg-[#0EA5A0] text-white text-sm font-medium rounded-xl hover:bg-[#0D7A76] transition-colors"
          >
            + 등록
          </Link>
        )}
      </div>

      {/* 통계 배너 */}
      {!loading && <StatsBanner caches={caches} foundIds={foundIds} />}

      {/* 검색 */}
      <input
        value={searchQ}
        onChange={e => setSearchQ(e.target.value)}
        placeholder="캐시 이름, 지역, 태그 검색..."
        className="w-full border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#0EA5A0]"
      />

      {/* 타입 필터 */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TYPE_FILTERS.map(f => (
          <button key={f.key} onClick={() => setTypeFilter(f.key)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              typeFilter === f.key ? 'bg-[#0EA5A0] text-white' : 'bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0]'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* 부가 필터 + 정렬 */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setGiftOnly(v => !v)}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
            giftOnly ? 'bg-orange-100 border-orange-300 text-orange-600' : 'bg-white border-[#E2E8F0] text-[#64748B]'
          }`}>
          🎁 선물있음
        </button>
        {position && (
          <button
            onClick={() => setNearbyOnly(v => !v)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              nearbyOnly ? 'bg-blue-100 border-blue-300 text-blue-600' : 'bg-white border-[#E2E8F0] text-[#64748B]'
            }`}>
            📍 3km 이내
          </button>
        )}
        <div className="ml-auto flex items-center gap-1">
          <span className="text-xs text-[#64748B]">정렬:</span>
          <select
            value={sortKey}
            onChange={e => setSortKey(e.target.value)}
            className="text-xs border border-[#E2E8F0] rounded-lg px-2 py-1 outline-none bg-white"
          >
            {SORT_OPTIONS.map(s => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 결과 */}
      <p className="text-xs text-[#64748B]">{filtered.length}개 캐시</p>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-40 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-[#64748B] text-sm">조건에 맞는 캐시가 없어요</p>
          {user && (
            <Link href="/geocaching/new"
              className="inline-block mt-4 px-6 py-2.5 bg-[#0EA5A0] text-white text-sm font-medium rounded-xl">
              첫 캐시 등록하기
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(c => (
            <GeocacheCard
              key={c.id}
              cache={c}
              userLat={position?.lat}
              userLng={position?.lng}
              foundCacheIds={foundIds}
            />
          ))}
        </div>
      )}

      {/* 비로그인 안내 */}
      {!user && !loading && (
        <div className="bg-[#F0FDF9] border border-[#0EA5A0]/30 rounded-2xl p-4 text-center">
          <p className="text-sm text-[#1A2F4B] font-medium mb-1">로그인하면 더 많은 기능을!</p>
          <p className="text-xs text-[#64748B] mb-3">발견 기록, 캐시 등록, 선물 수령</p>
          <Link href="/auth"
            className="inline-block px-6 py-2 bg-[#0EA5A0] text-white text-sm font-medium rounded-xl">
            로그인
          </Link>
        </div>
      )}
    </div>
  );
}
