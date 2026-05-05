'use client';

import { useEffect, useRef, useState } from 'react';
import { collection, getDocs, doc, setDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { CCTVLocation } from '@/types';
import Image from 'next/image';

type Direction = '동' | '서' | '남' | '북';
const DIRECTIONS: Direction[] = ['동', '서', '남', '북'];

const BLANK: Omit<CCTVLocation, 'id' | 'lastThumbnailAt'> = {
  name: '', region: '', lat: 0, lng: 0, streamUrl: '',
  tags: [], nearbyPoiIds: [], nearbyOreumIds: [],
  isActive: true, thumbnailUrl: '',
};

export default function AdminCCTVPage() {
  const [list, setList] = useState<CCTVLocation[]>([]);
  const [editing, setEditing] = useState<(Partial<CCTVLocation> & { id?: string }) | null>(null);
  const [saving, setSaving] = useState(false);
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [thumbPreview, setThumbPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  async function load() {
    const snap = await getDocs(collection(db, 'cctv_locations'));
    setList(
      snap.docs
        .map(d => ({ id: d.id, ...d.data() } as CCTVLocation))
        .sort((a, b) => a.region.localeCompare(b.region))
    );
  }

  useEffect(() => { load(); }, []);

  function openEdit(cctv?: CCTVLocation) {
    setEditing(cctv ? { ...cctv } : {});
    setThumbFile(null);
    setThumbPreview(null);
  }

  function handleThumbChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setThumbFile(f);
    setThumbPreview(URL.createObjectURL(f));
  }

  async function save() {
    if (!editing) return;
    setSaving(true);
    try {
      const id = editing.id ?? crypto.randomUUID();

      // 썸네일 먼저 업로드 (새 파일이 있을 때만)
      let thumbnailUrl = editing.thumbnailUrl ?? '';
      if (thumbFile) {
        setUploading(true);
        const fd = new FormData();
        fd.append('photo', thumbFile);
        fd.append('cctvId', id);
        const res = await fetch('/api/admin/cctv-thumbnail', { method: 'POST', body: fd });
        const data = await res.json();
        if (data.thumbnailUrl) thumbnailUrl = data.thumbnailUrl;
        setUploading(false);
      }

      await setDoc(doc(db, 'cctv_locations', id), {
        ...BLANK,
        ...editing,
        id,
        thumbnailUrl,
        tags: typeof editing.tags === 'string'
          ? (editing.tags as unknown as string).split(',').map((t: string) => t.trim()).filter(Boolean)
          : editing.tags ?? [],
        lastThumbnailAt: Timestamp.now(),
      });

      await load();
      setEditing(null);
      setThumbFile(null);
      setThumbPreview(null);
    } finally {
      setSaving(false);
      setUploading(false);
    }
  }

  async function remove(id: string) {
    if (!confirm('삭제하시겠습니까?')) return;
    await deleteDoc(doc(db, 'cctv_locations', id));
    await load();
  }

  const DIR_COLOR: Record<string, string> = {
    '동': 'bg-amber-100 text-amber-700',
    '서': 'bg-blue-100 text-blue-700',
    '남': 'bg-emerald-100 text-emerald-700',
    '북': 'bg-violet-100 text-violet-700',
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-[#1A2F4B]">CCTV 관리 ({list.length})</h1>
        <button onClick={() => openEdit()} className="px-4 py-2 bg-[#0EA5A0] text-white rounded-lg text-sm font-medium">
          + 추가
        </button>
      </div>

      <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
            <tr>
              {['썸네일', '지역', '이름', '방향', '상태', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[#64748B]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {list.map(c => (
              <tr key={c.id} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC]">
                <td className="px-4 py-3">
                  {c.thumbnailUrl ? (
                    <div className="relative w-16 h-9 rounded-md overflow-hidden bg-gray-100">
                      <Image src={c.thumbnailUrl} alt={c.name} fill className="object-cover" unoptimized />
                    </div>
                  ) : (
                    <div className="w-16 h-9 rounded-md bg-gray-100 flex items-center justify-center text-gray-400 text-xs">없음</div>
                  )}
                </td>
                <td className="px-4 py-3 text-[#64748B]">{c.region}</td>
                <td className="px-4 py-3 font-medium text-[#1A2F4B]">{c.name}</td>
                <td className="px-4 py-3">
                  {c.direction ? (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${DIR_COLOR[c.direction] ?? 'bg-gray-100 text-gray-500'}`}>
                      {c.direction}
                    </span>
                  ) : <span className="text-gray-300 text-xs">—</span>}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {c.isActive ? 'ON' : 'OFF'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(c)} className="text-xs text-[#0EA5A0] hover:underline">수정</button>
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
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="font-bold text-[#1A2F4B] mb-4">{editing.id ? 'CCTV 수정' : 'CCTV 추가'}</h2>

            {/* 기본 필드 */}
            {[
              { key: 'name', label: '이름', placeholder: '예: 협재해수욕장' },
              { key: 'region', label: '지역', placeholder: '예: 한림' },
              { key: 'streamUrl', label: '스트림 URL', placeholder: 'http://...' },
              { key: 'lat', label: '위도', placeholder: '33.xxxx' },
              { key: 'lng', label: '경도', placeholder: '126.xxxx' },
            ].map(f => (
              <div key={f.key} className="mb-3">
                <label className="text-xs font-medium text-[#64748B] mb-1 block">{f.label}</label>
                <input
                  value={(editing as Record<string, unknown>)[f.key] as string ?? ''}
                  placeholder={f.placeholder}
                  onChange={e => setEditing(prev => ({ ...prev, [f.key]: e.target.value }))}
                  className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#0EA5A0]"
                />
              </div>
            ))}

            {/* 방향 선택 */}
            <div className="mb-3">
              <label className="text-xs font-medium text-[#64748B] mb-2 block">방향</label>
              <div className="flex gap-2">
                {DIRECTIONS.map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setEditing(prev => ({ ...prev, direction: d }))}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold border-2 transition-colors ${
                      editing.direction === d
                        ? 'border-[#0EA5A0] bg-[#E0F7F6] text-[#0EA5A0]'
                        : 'border-[#E2E8F0] text-[#64748B] hover:border-[#CBD5E1]'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* 썸네일 업로드 */}
            <div className="mb-3">
              <label className="text-xs font-medium text-[#64748B] mb-2 block">썸네일 이미지</label>
              <div
                className="border-2 border-dashed border-[#E2E8F0] rounded-xl overflow-hidden cursor-pointer hover:border-[#0EA5A0] transition-colors"
                onClick={() => thumbInputRef.current?.click()}
              >
                {thumbPreview || editing.thumbnailUrl ? (
                  <div className="relative aspect-video">
                    <Image
                      src={thumbPreview ?? editing.thumbnailUrl ?? ''}
                      alt="썸네일 미리보기"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/30 transition-colors">
                      <span className="text-white opacity-0 hover:opacity-100 text-xs font-medium">변경하기</span>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-video flex flex-col items-center justify-center gap-2 text-[#94A3B8]">
                    <span className="text-2xl">📷</span>
                    <span className="text-xs">클릭해서 이미지 선택</span>
                  </div>
                )}
              </div>
              <input
                ref={thumbInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleThumbChange}
              />
            </div>

            {/* 활성화 */}
            <label className="flex items-center gap-2 mb-4 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={editing.isActive ?? true}
                onChange={e => setEditing(prev => ({ ...prev, isActive: e.target.checked }))}
              />
              활성화
            </label>

            <div className="flex gap-2">
              <button
                onClick={save}
                disabled={saving || uploading}
                className="flex-1 bg-[#0EA5A0] text-white rounded-lg py-2.5 text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {uploading ? '업로드 중...' : saving ? '저장 중...' : '저장'}
              </button>
              <button onClick={() => setEditing(null)} className="px-4 border border-[#E2E8F0] rounded-lg text-sm">
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
