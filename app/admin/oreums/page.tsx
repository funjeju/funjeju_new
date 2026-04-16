'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc, query, orderBy, limit, startAfter, QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Oreum } from '@/types';

export default function AdminOreumPage() {
  const [list, setList] = useState<Oreum[]>([]);
  const [last, setLast] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');

  async function load(reset = false) {
    const constraints: any[] = [orderBy('name'), limit(30)];
    if (!reset && last) constraints.push(startAfter(last));

    const snap = await getDocs(query(collection(db, 'oreums'), ...constraints));
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as Oreum));
    setList(prev => reset ? items : [...prev, ...items]);
    setLast(snap.docs[snap.docs.length - 1] ?? null);
    setHasMore(snap.docs.length === 30);
  }

  useEffect(() => { load(true); }, []);

  async function togglePublish(o: Oreum) {
    await updateDoc(doc(db, 'oreums', o.id), { isPublished: !o.isPublished });
    setList(prev => prev.map(x => x.id === o.id ? { ...x, isPublished: !x.isPublished } : x));
  }

  const filtered = list.filter(o =>
    filter === 'all' ? true : filter === 'published' ? o.isPublished : !o.isPublished
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-[#1A2F4B]">오름 관리 ({list.length})</h1>
        <div className="flex gap-2">
          {(['all', 'published', 'draft'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${filter === f ? 'bg-[#0EA5A0] text-white' : 'bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0]'}`}>
              {f === 'all' ? '전체' : f === 'published' ? '발행됨' : '미발행'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
            <tr>{['오름 이름', '지역', '주소', '발행 상태', ''].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[#64748B]">{h}</th>)}</tr>
          </thead>
          <tbody>
            {filtered.map(o => (
              <tr key={o.id} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC]">
                <td className="px-4 py-3 font-medium text-[#1A2F4B]">{o.name}</td>
                <td className="px-4 py-3 text-[#64748B]">{o.region}</td>
                <td className="px-4 py-3 text-xs text-[#64748B] max-w-xs truncate">{o.address}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${o.isPublished ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {o.isPublished ? '발행됨' : '미발행'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => togglePublish(o)}
                    className={`text-xs px-3 py-1 rounded-lg ${o.isPublished ? 'bg-gray-100 text-gray-600' : 'bg-[#0EA5A0] text-white'}`}>
                    {o.isPublished ? '내리기' : '발행하기'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hasMore && (
        <button onClick={() => load()} className="w-full mt-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm text-[#64748B] hover:bg-[#F8FAFC]">
          더 보기
        </button>
      )}
    </div>
  );
}
