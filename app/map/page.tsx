'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { CCTVLocation } from '@/types';
import CCTVPopup from '@/components/cctv/CCTVPopup';
import Image from 'next/image';

const FILTERS = ['전체', '동', '서', '남', '북'] as const;
type Filter = typeof FILTERS[number];

const DIR_COLOR: Record<string, string> = {
  '동': 'bg-amber-500',
  '서': 'bg-blue-500',
  '남': 'bg-emerald-500',
  '북': 'bg-violet-500',
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function CCTVPage() {
  const [cctvList, setCctvList] = useState<CCTVLocation[]>([]);
  const [displayed, setDisplayed] = useState<CCTVLocation[]>([]);
  const [selected, setSelected] = useState<CCTVLocation | null>(null);
  const [filter, setFilter] = useState<Filter>('전체');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDocs(query(collection(db, 'cctv_locations'), where('isActive', '==', true)))
      .then(snap => setCctvList(snap.docs.map(d => ({ id: d.id, ...d.data() } as CCTVLocation))))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const base = filter === '전체'
      ? cctvList
      : cctvList.filter(c => c.direction === filter);
    setDisplayed(shuffle(base));
  }, [cctvList, filter]);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* 필터 바 */}
      <div className="sticky top-0 md:top-16 z-30 bg-white border-b border-[#E2E8F0]">
        <div className="px-4 py-3 flex items-center gap-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide flex-1">
            {FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                  filter === f
                    ? 'bg-[#0EA5A0] text-white'
                    : 'bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <span className="text-xs text-[#94A3B8] whitespace-nowrap flex-shrink-0">
            {displayed.length}개
          </span>
        </div>
      </div>

      {/* 그리드 */}
      <div className="px-3 py-4 pb-24 md:pb-10">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-video rounded-xl bg-gray-200 animate-pulse" />
            ))}
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <span className="text-5xl">📡</span>
            <p className="text-[#64748B] text-sm">
              {filter === '전체' ? 'CCTV 정보가 없습니다' : `${filter}쪽 CCTV가 없습니다`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {displayed.map(cctv => (
              <CCTVCard key={cctv.id} cctv={cctv} onClick={() => setSelected(cctv)} />
            ))}
          </div>
        )}
      </div>

      {selected && <CCTVPopup cctv={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function CCTVCard({ cctv, onClick }: { cctv: CCTVLocation; onClick: () => void }) {
  const dirColor = DIR_COLOR[cctv.direction ?? ''] ?? 'bg-slate-500';

  return (
    <button
      onClick={onClick}
      className="group relative aspect-video rounded-xl overflow-hidden bg-gray-900 shadow-sm hover:shadow-lg transition-all duration-200 text-left w-full"
    >
      {cctv.thumbnailUrl ? (
        <Image
          src={cctv.thumbnailUrl}
          alt={cctv.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          unoptimized
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
          <span className="text-white/20 text-3xl">📹</span>
        </div>
      )}

      {/* 그라디언트 */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/25 pointer-events-none" />

      {/* 상단 뱃지 */}
      <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-white bg-red-500 px-1.5 py-0.5 rounded">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          LIVE
        </span>
        {cctv.direction && (
          <span className={`text-[10px] font-bold text-white px-1.5 py-0.5 rounded ${dirColor}`}>
            {cctv.direction}
          </span>
        )}
      </div>

      {/* 하단 정보 */}
      <div className="absolute bottom-0 left-0 right-0 px-2.5 pb-2.5 pt-4">
        <p className="text-white text-xs font-semibold leading-tight line-clamp-1">{cctv.name}</p>
        <p className="text-white/60 text-[10px] mt-0.5 leading-none">{cctv.region}</p>
      </div>
    </button>
  );
}
