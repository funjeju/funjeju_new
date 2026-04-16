'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, where, orderBy, limit, startAfter, QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Oreum, OreumStamp } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import OreumCard from '@/components/oreum/OreumCard';

const REGIONS = ['전체', '제주시', '서귀포', '애월', '한림', '성산', '조천', '구좌', '안덕', '대정'];
const DIFFICULTIES = ['전체', '★', '★★', '★★★', '★★★★', '★★★★★'];

export default function OreumPage() {
  const { user } = useAuth();
  const [oreums, setOreums] = useState<Oreum[]>([]);
  const [stamps, setStamps] = useState<Set<string>>(new Set());
  const [region, setRegion] = useState('전체');
  const [diff, setDiff] = useState('전체');
  const [search, setSearch] = useState('');
  const [last, setLast] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);

  async function load(reset = false) {
    if (!reset && !hasMore) return;
    setLoading(true);
    const constraints: any[] = [where('isPublished', '==', true), orderBy('name'), limit(24)];
    if (!reset && last) constraints.push(startAfter(last));
    const snap = await getDocs(query(collection(db, 'oreums'), ...constraints));
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as Oreum));
    setOreums(prev => reset ? items : [...prev, ...items]);
    setLast(snap.docs[snap.docs.length - 1] ?? null);
    setHasMore(snap.docs.length === 24);
    setLoading(false);
  }

  useEffect(() => { load(true); }, []);

  useEffect(() => {
    if (!user) return;
    getDocs(collection(db, 'oreum_stamps')).then(snap => {
      setStamps(new Set(snap.docs.filter(d => d.data().uid === user.uid).map(d => d.data().oreumId)));
    });
  }, [user]);

  const filtered = oreums.filter(o => {
    if (region !== '전체' && !o.region?.includes(region)) return false;
    if (diff !== '전체' && o.difficulty !== DIFFICULTIES.indexOf(diff)) return false;
    if (search && !o.name.includes(search)) return false;
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-[#1A2F4B]">🌿 오름 도감</h1>
        <p className="text-sm text-[#64748B]">{stamps.size} / {oreums.length} 인증</p>
      </div>

      {/* 진행률 */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-[#1A2F4B]">스탬프 진행률</span>
          <span className="text-sm text-[#0EA5A0]">{stamps.size}개 인증</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-[#0EA5A0] rounded-full transition-all" style={{ width: `${oreums.length ? (stamps.size / oreums.length) * 100 : 0}%` }} />
        </div>
      </div>

      {/* 검색·필터 */}
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="오름 이름 검색..."
        className="w-full border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#0EA5A0] mb-3" />
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {REGIONS.map(r => (
          <button key={r} onClick={() => setRegion(r)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium ${region === r ? 'bg-[#0EA5A0] text-white' : 'bg-white border border-[#E2E8F0] text-[#64748B]'}`}>{r}</button>
        ))}
      </div>

      {/* 그리드 */}
      {loading && oreums.length === 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-48 bg-gray-200 rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {filtered.map(o => <OreumCard key={o.id} oreum={o} isStamped={stamps.has(o.id)} />)}
        </div>
      )}

      {hasMore && !loading && (
        <button onClick={() => load()} className="w-full mt-6 py-3 border border-[#E2E8F0] rounded-xl text-sm text-[#64748B] hover:bg-[#F8FAFC]">
          더 보기
        </button>
      )}
    </div>
  );
}
