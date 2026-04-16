'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Mission, MissionProgress } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import MissionCard from '@/components/mission/MissionCard';

const FILTERS = ['전체', '진행중', '완료', '해안', '오름'];

export default function MissionsPage() {
  const { user } = useAuth();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [progressMap, setProgressMap] = useState<Map<string, MissionProgress>>(new Map());
  const [filter, setFilter] = useState('전체');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDocs(query(collection(db, 'missions'), where('isPublished', '==', true), orderBy('createdAt', 'desc')))
      .then(snap => setMissions(snap.docs.map(d => ({ id: d.id, ...d.data() } as Mission))))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user) return;
    getDocs(query(collection(db, 'mission_progress'), where('uid', '==', user.uid))).then(snap => {
      const map = new Map<string, MissionProgress>();
      snap.docs.forEach(d => { const p = d.data() as MissionProgress; map.set(p.missionId, p); });
      setProgressMap(map);
    });
  }, [user]);

  const filtered = missions.filter(m => {
    if (filter === '진행중') return progressMap.get(m.id)?.status === 'in_progress';
    if (filter === '완료') return progressMap.get(m.id)?.status === 'completed';
    if (filter !== '전체') return m.tags?.includes(filter);
    return true;
  });

  function getProgress(m: Mission): number | undefined {
    const p = progressMap.get(m.id);
    if (!p) return undefined;
    return (p.completedSpots.length / m.spots.length) * 100;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-[#1A2F4B] mb-4">🎯 제주 미션</h1>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium ${filter === f ? 'bg-[#F59E0B] text-white' : 'bg-white border border-[#E2E8F0] text-[#64748B]'}`}>{f}</button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-48 bg-gray-200 rounded-xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-[#64748B]">
          <p className="text-3xl mb-2">🎯</p>
          <p className="text-sm">아직 미션이 없어요</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {filtered.map(m => <MissionCard key={m.id} mission={m} progress={getProgress(m)} />)}
        </div>
      )}
    </div>
  );
}
