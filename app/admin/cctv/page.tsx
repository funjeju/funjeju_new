'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, doc, setDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { CCTVLocation } from '@/types';

const BLANK: Omit<CCTVLocation, 'id' | 'lastThumbnailAt'> = {
  name: '', region: '', lat: 0, lng: 0, streamUrl: '',
  tags: [], nearbyPoiIds: [], nearbyOreumIds: [],
  isActive: true, thumbnailUrl: '',
};

export default function AdminCCTVPage() {
  const [list, setList] = useState<CCTVLocation[]>([]);
  const [editing, setEditing] = useState<(Partial<CCTVLocation> & { id?: string }) | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    const snap = await getDocs(collection(db, 'cctv_locations'));
    setList(snap.docs.map(d => ({ id: d.id, ...d.data() } as CCTVLocation))
      .sort((a, b) => a.region.localeCompare(b.region)));
  }

  useEffect(() => { load(); }, []);

  async function save() {
    if (!editing) return;
    setSaving(true);
    const id = editing.id ?? crypto.randomUUID();
    await setDoc(doc(db, 'cctv_locations', id), {
      ...BLANK, ...editing, id,
      tags: typeof editing.tags === 'string' ? (editing.tags as any).split(',').map((t: string) => t.trim()) : editing.tags ?? [],
      lastThumbnailAt: Timestamp.now(),
    });
    await load();
    setEditing(null);
    setSaving(false);
  }

  async function remove(id: string) {
    if (!confirm('삭제하시겠습니까?')) return;
    await deleteDoc(doc(db, 'cctv_locations', id));
    await load();
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-[#1A2F4B]">CCTV 관리 ({list.length})</h1>
        <button onClick={() => setEditing({})} className="px-4 py-2 bg-[#0EA5A0] text-white rounded-lg text-sm">+ 추가</button>
      </div>

      <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
            <tr>{['지역', '이름', '상태', '스트림 URL', ''].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[#64748B]">{h}</th>)}</tr>
          </thead>
          <tbody>
            {list.map(c => (
              <tr key={c.id} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC]">
                <td className="px-4 py-3 text-[#64748B]">{c.region}</td>
                <td className="px-4 py-3 font-medium text-[#1A2F4B]">{c.name}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {c.isActive ? 'ON' : 'OFF'}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-[#64748B] max-w-xs truncate">{c.streamUrl}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => setEditing(c)} className="text-xs text-[#0EA5A0] hover:underline">수정</button>
                    <button onClick={() => remove(c.id)} className="text-xs text-red-500 hover:underline">삭제</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 편집 모달 */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setEditing(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h2 className="font-bold text-[#1A2F4B] mb-4">{editing.id ? 'CCTV 수정' : 'CCTV 추가'}</h2>
            {[
              { key: 'name', label: '이름', placeholder: '예: 협재해수욕장' },
              { key: 'region', label: '지역', placeholder: '예: 한림' },
              { key: 'streamUrl', label: '스트림 URL', placeholder: 'http://...' },
              { key: 'lat', label: '위도', placeholder: '33.xxxx' },
              { key: 'lng', label: '경도', placeholder: '126.xxxx' },
              { key: 'tags', label: '태그 (쉼표 구분)', placeholder: '해안, 드라이브' },
            ].map(f => (
              <div key={f.key} className="mb-3">
                <label className="text-xs font-medium text-[#64748B] mb-1 block">{f.label}</label>
                <input value={(editing as any)[f.key] ?? ''} placeholder={f.placeholder}
                  onChange={e => setEditing(prev => ({ ...prev, [f.key]: e.target.value }))}
                  className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#0EA5A0]" />
              </div>
            ))}
            <label className="flex items-center gap-2 mb-4 text-sm">
              <input type="checkbox" checked={editing.isActive ?? true}
                onChange={e => setEditing(prev => ({ ...prev, isActive: e.target.checked }))} />
              활성화
            </label>
            <div className="flex gap-2">
              <button onClick={save} disabled={saving}
                className="flex-1 bg-[#0EA5A0] text-white rounded-lg py-2.5 text-sm font-semibold disabled:opacity-50">
                {saving ? '저장 중...' : '저장'}
              </button>
              <button onClick={() => setEditing(null)} className="px-4 border border-[#E2E8F0] rounded-lg text-sm">취소</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
