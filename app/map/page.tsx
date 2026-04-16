'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { CCTVLocation } from '@/types';
import KakaoMap from '@/components/map/KakaoMap';
import CCTVPopup from '@/components/cctv/CCTVPopup';

const FILTERS = ['전체', '해안', '도심', '오름', '항구', '드라이브'];

export default function MapPage() {
  const [cctvList, setCctvList] = useState<CCTVLocation[]>([]);
  const [selected, setSelected] = useState<CCTVLocation | null>(null);
  const [filter, setFilter] = useState('전체');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDocs(query(collection(db, 'cctv_locations'), where('isActive', '==', true)))
      .then(snap => setCctvList(snap.docs.map(d => ({ id: d.id, ...d.data() } as CCTVLocation))))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === '전체'
    ? cctvList
    : cctvList.filter(c => c.tags?.some(t => t.includes(filter)));

  const markers = filtered.map(c => ({ id: c.id, lat: c.lat, lng: c.lng, title: c.name, isActive: c.isActive }));

  function handleMarkerClick(id: string) {
    setSelected(cctvList.find(c => c.id === id) ?? null);
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] md:h-[calc(100vh-64px)]">
      {/* 필터 */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto bg-white border-b border-[#E2E8F0]">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === f ? 'bg-[#0EA5A0] text-white' : 'bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0]'
            }`}>{f}</button>
        ))}
      </div>

      {/* 지도 */}
      <div className="flex-1 relative">
        {loading ? (
          <div className="h-full flex items-center justify-center bg-gray-100">
            <p className="text-[#64748B]">지도 불러오는 중...</p>
          </div>
        ) : (
          <KakaoMap markers={markers} onMarkerClick={handleMarkerClick} className="w-full h-full" />
        )}

        {/* CCTV 목록 사이드 (PC) */}
        <div className="hidden md:block absolute top-4 right-4 w-64 max-h-[calc(100%-32px)] overflow-y-auto bg-white rounded-xl shadow-lg">
          <div className="p-3 border-b border-[#E2E8F0]">
            <p className="text-sm font-semibold text-[#1A2F4B]">CCTV 목록 ({filtered.length})</p>
          </div>
          {filtered.map(c => (
            <button key={c.id} onClick={() => setSelected(c)}
              className="w-full text-left px-3 py-2.5 border-b border-[#E2E8F0] hover:bg-[#E0F7F6] transition-colors">
              <p className="text-sm font-medium text-[#1A2F4B]">{c.name}</p>
              <p className="text-xs text-[#64748B]">{c.region}</p>
            </button>
          ))}
        </div>
      </div>

      {/* CCTV 팝업 */}
      {selected && <CCTVPopup cctv={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
