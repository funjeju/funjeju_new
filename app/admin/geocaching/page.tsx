'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, updateDoc, doc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Geocache } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? 'admin@funjeju.com').split(',');

const TYPE_ICON: Record<string, string> = {
  traditional: '📦', multi: '🔗', mystery: '❓', virtual: '👁', earthcache: '🌍', challenge: '🏆',
};

type ViewFilter = 'pending' | 'published' | 'all';

export default function AdminGeocachingPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [caches, setCaches] = useState<Geocache[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewFilter>('pending');
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || !ADMIN_EMAILS.includes(user.email ?? ''))) {
      router.replace('/');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function load() {
      const constraints: any[] = [orderBy('createdAt', 'desc')];
      if (view === 'pending')   constraints.unshift(where('isPublished', '==', false));
      if (view === 'published') constraints.unshift(where('isPublished', '==', true));

      const snap = await getDocs(query(collection(db, 'geocaches'), ...constraints));
      setCaches(snap.docs.map(d => ({ id: d.id, ...d.data() } as Geocache)));
      setLoading(false);
    }
    load();
  }, [view]);

  async function togglePublish(cache: Geocache) {
    setUpdating(cache.id);
    await updateDoc(doc(db, 'geocaches', cache.id), { isPublished: !cache.isPublished });
    setCaches(prev => prev.map(c => c.id === cache.id ? { ...c, isPublished: !c.isPublished } : c));
    setUpdating(null);
  }

  async function toggleActive(cache: Geocache) {
    setUpdating(cache.id);
    await updateDoc(doc(db, 'geocaches', cache.id), { isActive: !cache.isActive });
    setCaches(prev => prev.map(c => c.id === cache.id ? { ...c, isActive: !c.isActive } : c));
    setUpdating(null);
  }

  async function archive(cache: Geocache) {
    if (!confirm(`"${cache.title}"을 보관 처리하시겠어요?`)) return;
    setUpdating(cache.id);
    await updateDoc(doc(db, 'geocaches', cache.id), { isArchived: true, isPublished: false, isActive: false });
    setCaches(prev => prev.filter(c => c.id !== cache.id));
    setUpdating(null);
  }

  if (authLoading || loading) return (
    <div className="flex items-center justify-center min-h-screen"><p className="text-[#64748B]">로딩 중...</p></div>
  );

  const pendingCount = caches.filter(c => !c.isPublished).length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2F4B]">🗺 지오캐싱 관리</h1>
          <p className="text-sm text-[#64748B] mt-0.5">캐시 승인 · 비활성화 · 보관</p>
        </div>
        <Link href="/admin" className="text-sm text-[#64748B] hover:text-[#0EA5A0]">← 대시보드</Link>
      </div>

      {/* 탭 */}
      <div className="flex gap-2 mb-6">
        {([
          { key: 'pending', label: `승인 대기 (${pendingCount})` },
          { key: 'published', label: '공개 중' },
          { key: 'all', label: '전체' },
        ] as { key: ViewFilter; label: string }[]).map(t => (
          <button key={t.key} onClick={() => setView(t.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              view === t.key ? 'bg-[#0EA5A0] text-white' : 'bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0]'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* 목록 */}
      {caches.length === 0 ? (
        <div className="text-center py-16 text-[#64748B]">
          <p className="text-4xl mb-3">🗺</p>
          <p>{view === 'pending' ? '승인 대기 중인 캐시가 없어요' : '캐시가 없어요'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {caches.map(cache => (
            <div key={cache.id} className="bg-white border border-[#E2E8F0] rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{TYPE_ICON[cache.type] ?? '📦'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-[#1A2F4B] text-sm">{cache.title}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                      cache.isPublished ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {cache.isPublished ? '공개' : '비공개'}
                    </span>
                    {!cache.isActive && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 font-medium">비활성</span>
                    )}
                    {cache.hasGift && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-600">🎁 선물</span>
                    )}
                  </div>
                  <p className="text-xs text-[#64748B] mt-0.5 line-clamp-1">{cache.region} · {cache.description}</p>
                  <div className="flex gap-3 text-[11px] text-[#94A3B8] mt-1">
                    <span>등록: {cache.createdByName}</span>
                    <span>발견 {cache.foundCount}회</span>
                    <span>즐겨찾기 {cache.favoriteCount}</span>
                    <span>난이도 {cache.difficulty.toFixed(1)} / 지형 {cache.terrain.toFixed(1)}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-3 flex-wrap">
                <Link href={`/geocaching/${cache.id}`}
                  className="px-3 py-1.5 text-xs border border-[#E2E8F0] rounded-lg text-[#64748B] hover:bg-[#F8FAFC]">
                  상세보기
                </Link>
                <button
                  onClick={() => togglePublish(cache)}
                  disabled={updating === cache.id}
                  className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors disabled:opacity-50 ${
                    cache.isPublished
                      ? 'bg-red-50 border border-red-200 text-red-600 hover:bg-red-100'
                      : 'bg-green-50 border border-green-200 text-green-700 hover:bg-green-100'
                  }`}>
                  {cache.isPublished ? '비공개 전환' : '✅ 승인·공개'}
                </button>
                <button
                  onClick={() => toggleActive(cache)}
                  disabled={updating === cache.id}
                  className="px-3 py-1.5 text-xs border border-[#E2E8F0] rounded-lg text-[#64748B] hover:bg-[#F8FAFC] disabled:opacity-50">
                  {cache.isActive ? '비활성화' : '활성화'}
                </button>
                <button
                  onClick={() => archive(cache)}
                  disabled={updating === cache.id}
                  className="px-3 py-1.5 text-xs border border-red-200 rounded-lg text-red-400 hover:bg-red-50 disabled:opacity-50 ml-auto">
                  보관
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
