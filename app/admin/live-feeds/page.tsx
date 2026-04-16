'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, updateDoc, deleteDoc, doc, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { LiveFeed } from '@/types';
import Image from 'next/image';
import Link from 'next/link';

const CTA_OPTIONS = [
  { value: 'visit', label: '📍 방문하기' },
  { value: 'call', label: '📞 전화하기' },
  { value: 'menu', label: '🍽 메뉴 보기' },
  { value: 'reserve', label: '📅 예약하기' },
];

const REGIONS = ['제주시', '서귀포', '애월', '한림', '성산', '조천', '구좌', '안덕', '대정'];

function AddFeedModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [businessName, setBusinessName] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [region, setRegion] = useState('제주시');
  const [ctaType, setCtaType] = useState('visit');
  const [ctaLabel, setCtaLabel] = useState('지금 방문하기');
  const [ctaUrl, setCtaUrl] = useState('');
  const [ctaPhone, setCtaPhone] = useState('');
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!businessName || !photoUrl) return alert('업체명과 사진 URL은 필수입니다');
    setSaving(true);
    await addDoc(collection(db, 'live_feeds'), {
      partnerId: 'admin',
      businessName, photoUrl, caption, region,
      ctaType, ctaLabel,
      ctaUrl: ctaType !== 'call' ? ctaUrl : null,
      ctaPhone: ctaType === 'call' ? ctaPhone : null,
      tags: [],
      isApproved: true,
      createdAt: Timestamp.now(),
    });
    setSaving(false);
    onSaved();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="font-bold text-[#1A2F4B] mb-4">피드 직접 등록</h2>
        <div className="space-y-3">
          <input value={businessName} onChange={e => setBusinessName(e.target.value)}
            placeholder="업체명 *" className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm" />
          <input value={photoUrl} onChange={e => setPhotoUrl(e.target.value)}
            placeholder="사진 URL * (Firebase Storage URL)" className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm" />
          <input value={caption} onChange={e => setCaption(e.target.value)}
            placeholder="한 줄 소개" className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm" />
          <select value={region} onChange={e => setRegion(e.target.value)}
            className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm bg-white">
            {REGIONS.map(r => <option key={r}>{r}</option>)}
          </select>
          <select value={ctaType} onChange={e => {
            setCtaType(e.target.value);
            const opt = CTA_OPTIONS.find(o => o.value === e.target.value);
            setCtaLabel(opt?.label.replace(/^.+ /, '') ?? '');
          }} className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm bg-white">
            {CTA_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <input value={ctaLabel} onChange={e => setCtaLabel(e.target.value)}
            placeholder="버튼 문구" className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm" />
          {ctaType === 'call'
            ? <input value={ctaPhone} onChange={e => setCtaPhone(e.target.value)}
                placeholder="전화번호" className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm" />
            : <input value={ctaUrl} onChange={e => setCtaUrl(e.target.value)}
                placeholder="링크 URL" className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm" />
          }
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="flex-1 py-2 border border-[#E2E8F0] rounded-xl text-sm">취소</button>
          <button onClick={save} disabled={saving}
            className="flex-1 py-2 bg-[#0EA5A0] text-white rounded-xl text-sm font-semibold disabled:opacity-40">
            {saving ? '저장중...' : '등록'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminLiveFeedsPage() {
  const [feeds, setFeeds] = useState<LiveFeed[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  async function load() {
    setLoading(true);
    const snap = await getDocs(query(collection(db, 'live_feeds'), orderBy('createdAt', 'desc')));
    setFeeds(snap.docs.map(d => ({ id: d.id, ...d.data() } as LiveFeed)));
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function toggleApprove(feed: LiveFeed) {
    await updateDoc(doc(db, 'live_feeds', feed.id), { isApproved: !feed.isApproved });
    setFeeds(prev => prev.map(f => f.id === feed.id ? { ...f, isApproved: !f.isApproved } : f));
  }

  async function deleteFeed(id: string) {
    if (!confirm('삭제하시겠습니까?')) return;
    await deleteDoc(doc(db, 'live_feeds', id));
    setFeeds(prev => prev.filter(f => f.id !== id));
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/admin" className="text-sm text-[#64748B] hover:text-[#0EA5A0]">← 어드민</Link>
          <h1 className="text-xl font-bold text-[#1A2F4B] mt-1">라이브 피드 관리</h1>
        </div>
        <div className="flex gap-2">
          <Link href="/partner/upload"
            className="px-4 py-2 border border-[#0EA5A0] text-[#0EA5A0] rounded-xl text-sm font-medium">
            파트너 업로드 페이지
          </Link>
          <button onClick={() => setShowAdd(true)}
            className="px-4 py-2 bg-[#0EA5A0] text-white rounded-xl text-sm font-medium">
            + 직접 등록
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-[#64748B]">로딩 중...</div>
      ) : feeds.length === 0 ? (
        <div className="text-center py-12 text-[#64748B]">
          <p className="text-3xl mb-2">📷</p>
          <p className="text-sm">등록된 피드가 없습니다</p>
          <p className="text-xs mt-1">파트너에게 <strong>/partner/upload</strong> 링크를 공유하세요</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {feeds.map(feed => (
            <div key={feed.id} className={`rounded-xl border overflow-hidden ${feed.isApproved ? 'border-green-300' : 'border-[#E2E8F0]'}`}>
              <div className="relative aspect-[4/3] bg-gray-100">
                {feed.photoUrl && (
                  <Image src={feed.photoUrl} alt={feed.businessName} fill className="object-cover" unoptimized />
                )}
                {!feed.isApproved && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="text-white text-xs font-bold bg-red-500 px-2 py-1 rounded">미승인</span>
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="text-sm font-semibold text-[#1A2F4B] truncate">{feed.businessName}</p>
                <p className="text-xs text-[#64748B]">{feed.region}</p>
                <div className="mt-1 bg-[#E0F7F6] rounded-lg px-2 py-1 text-xs text-[#0EA5A0] font-medium truncate">
                  {feed.ctaLabel}
                </div>
                <div className="flex gap-2 mt-2">
                  <button onClick={() => toggleApprove(feed)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium ${feed.isApproved ? 'bg-gray-100 text-[#64748B]' : 'bg-green-500 text-white'}`}>
                    {feed.isApproved ? '승인취소' : '승인'}
                  </button>
                  <button onClick={() => deleteFeed(feed.id)}
                    className="flex-1 py-1.5 bg-red-50 text-red-500 rounded-lg text-xs font-medium">
                    삭제
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && <AddFeedModal onClose={() => setShowAdd(false)} onSaved={load} />}
    </div>
  );
}
