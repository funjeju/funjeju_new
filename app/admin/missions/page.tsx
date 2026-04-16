'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, doc, setDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Mission } from '@/types';

const BLANK_MISSION = {
  title: '', description: '', thumbnailUrl: '', difficulty: 2 as const,
  estimatedMinutes: 60, tags: [] as string[], isPublished: false, participantCount: 0,
  spots: [
    { order: 1 as const, name: '', description: '', lat: 0, lng: 0, radiusMeters: 50, thumbnailUrl: '', hint: '' },
    { order: 2 as const, name: '', description: '', lat: 0, lng: 0, radiusMeters: 50, thumbnailUrl: '', hint: '' },
    { order: 3 as const, name: '', description: '', lat: 0, lng: 0, radiusMeters: 50, thumbnailUrl: '', hint: '' },
  ],
  reward: { type: 'point' as const, points: 50, description: '50포인트 지급' },
};

export default function AdminMissionsPage() {
  const [list, setList] = useState<Mission[]>([]);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<typeof BLANK_MISSION>(BLANK_MISSION);

  async function load() {
    const snap = await getDocs(collection(db, 'missions'));
    setList(snap.docs.map(d => ({ id: d.id, ...d.data() } as Mission)));
  }
  useEffect(() => { load(); }, []);

  async function save() {
    const id = crypto.randomUUID();
    await setDoc(doc(db, 'missions', id), { ...form, id, createdAt: Timestamp.now() });
    await load(); setCreating(false); setForm(BLANK_MISSION);
  }

  async function togglePublish(m: Mission) {
    await setDoc(doc(db, 'missions', m.id), { ...m, isPublished: !m.isPublished });
    await load();
  }

  async function remove(id: string) {
    if (!confirm('삭제?')) return;
    await deleteDoc(doc(db, 'missions', id)); await load();
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-[#1A2F4B]">미션 관리 ({list.length})</h1>
        <button onClick={() => setCreating(true)} className="px-4 py-2 bg-[#0EA5A0] text-white rounded-lg text-sm">+ 미션 생성</button>
      </div>

      <div className="space-y-3">
        {list.map(m => (
          <div key={m.id} className="bg-white border border-[#E2E8F0] rounded-xl px-4 py-3 flex items-center justify-between">
            <div>
              <p className="font-medium text-[#1A2F4B]">{m.title}</p>
              <p className="text-xs text-[#64748B]">{'★'.repeat(m.difficulty)} · {m.estimatedMinutes}분 · {m.participantCount}명 참여</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full ${m.isPublished ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {m.isPublished ? '발행' : '미발행'}
              </span>
              <button onClick={() => togglePublish(m)} className="text-xs text-[#0EA5A0] hover:underline">
                {m.isPublished ? '내리기' : '발행'}
              </button>
              <button onClick={() => remove(m.id)} className="text-xs text-red-500 hover:underline">삭제</button>
            </div>
          </div>
        ))}
      </div>

      {/* 미션 생성 모달 */}
      {creating && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 overflow-y-auto" onClick={() => setCreating(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg my-8" onClick={e => e.stopPropagation()}>
            <h2 className="font-bold text-[#1A2F4B] mb-4">미션 생성</h2>

            {[
              { key: 'title', label: '미션 제목' },
              { key: 'description', label: '설명' },
              { key: 'estimatedMinutes', label: '예상 시간(분)' },
            ].map(f => (
              <div key={f.key} className="mb-3">
                <label className="text-xs font-medium text-[#64748B] mb-1 block">{f.label}</label>
                <input value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#0EA5A0]" />
              </div>
            ))}

            <p className="text-xs font-semibold text-[#1A2F4B] mt-4 mb-2">스팟 3개</p>
            {form.spots.map((spot, i) => (
              <div key={i} className="bg-[#F8FAFC] rounded-lg p-3 mb-2 space-y-2">
                <p className="text-xs font-medium text-[#0EA5A0]">스팟 {i + 1}</p>
                {['name', 'description', 'hint'].map(k => (
                  <input key={k} placeholder={k} value={(spot as any)[k]}
                    onChange={e => {
                      const spots = [...form.spots];
                      (spots[i] as any)[k] = e.target.value;
                      setForm(p => ({ ...p, spots }));
                    }}
                    className="w-full border border-[#E2E8F0] rounded px-2 py-1.5 text-xs outline-none" />
                ))}
                <div className="flex gap-2">
                  {['lat', 'lng'].map(k => (
                    <input key={k} placeholder={k} value={(spot as any)[k] || ''}
                      onChange={e => {
                        const spots = [...form.spots];
                        (spots[i] as any)[k] = parseFloat(e.target.value) || 0;
                        setForm(p => ({ ...p, spots }));
                      }}
                      className="flex-1 border border-[#E2E8F0] rounded px-2 py-1.5 text-xs outline-none" />
                  ))}
                </div>
              </div>
            ))}

            <div className="flex gap-2 mt-4">
              <button onClick={save} className="flex-1 bg-[#0EA5A0] text-white rounded-lg py-2.5 text-sm font-semibold">저장</button>
              <button onClick={() => setCreating(false)} className="px-4 border border-[#E2E8F0] rounded-lg text-sm">취소</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
