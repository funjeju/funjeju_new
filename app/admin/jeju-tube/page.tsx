'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? '').split(',');

interface Video {
  id: string;
  videoId: string;
  title: string;
  channelName: string;
  thumbnail: string;
  category: string;
  summary?: string;
  publishedAt?: { seconds: number };
}

export default function AdminJejuTubePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [videos, setVideos] = useState<Video[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState('');

  useEffect(() => {
    if (!loading && (!user || !ADMIN_EMAILS.includes(user.email ?? ''))) {
      router.replace('/');
    }
  }, [user, loading, router]);

  async function loadVideos() {
    const snap = await getDocs(query(collection(db, 'jeju_tube_cache'), orderBy('cachedAt', 'desc')));
    setVideos(snap.docs.map(d => ({ id: d.id, ...d.data() } as Video)));
  }

  useEffect(() => { loadVideos(); }, []);

  async function handleSync() {
    setSyncing(true);
    setSyncResult('');
    try {
      const res = await fetch('/api/jeju-tube/sync', { method: 'POST' });
      const data = await res.json();
      setSyncResult(`완료: ${data.count}개 동기화`);
      await loadVideos();
    } catch {
      setSyncResult('오류 발생');
    } finally {
      setSyncing(false);
    }
  }

  async function handleDelete(videoId: string) {
    if (!confirm('삭제하시겠습니까?')) return;
    await deleteDoc(doc(db, 'jeju_tube_cache', videoId));
    setVideos(v => v.filter(x => x.id !== videoId));
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#1A2F4B]">📹 제주 유튜브 소식 관리</h1>
          <p className="text-xs text-[#64748B] mt-1">YouTube API로 최신 제주 영상을 가져와 캐시합니다</p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="px-5 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 disabled:opacity-50 flex items-center gap-2"
        >
          {syncing ? '동기화 중...' : '▶ YouTube 동기화'}
        </button>
      </div>

      {/* API 키 안내 */}
      {!process.env.NEXT_PUBLIC_YOUTUBE_API_KEY && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 text-sm text-yellow-800">
          ⚠️ <strong>YOUTUBE_API_KEY</strong> 환경변수를 Vercel에 추가해야 동기화가 작동합니다.
          <br />
          <span className="text-xs mt-1 block">Google Cloud Console → YouTube Data API v3 → 사용자 인증 정보 → API 키 발급</span>
        </div>
      )}

      {syncResult && (
        <div className="bg-[#E0F7F6] border border-[#0EA5A0]/30 rounded-xl p-3 mb-4 text-sm text-[#0EA5A0] font-medium">
          ✅ {syncResult}
        </div>
      )}

      {/* 영상 목록 */}
      <p className="text-sm text-[#64748B] mb-3">총 {videos.length}개 캐시됨</p>

      {videos.length === 0 ? (
        <div className="text-center py-16 text-[#64748B]">
          <p className="text-4xl mb-3">📹</p>
          <p className="text-sm">캐시된 영상이 없습니다</p>
          <p className="text-xs mt-1">YouTube 동기화 버튼을 눌러 영상을 가져오세요</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {videos.map(v => (
            <div key={v.id} className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden flex gap-3 p-3">
              <div className="relative w-32 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                {v.thumbnail && (
                  <Image src={v.thumbnail} alt={v.title} fill className="object-cover" unoptimized />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#1A2F4B] line-clamp-2 leading-tight">{v.title}</p>
                <p className="text-xs text-[#64748B] mt-0.5">{v.channelName}</p>
                {v.summary && <p className="text-xs text-[#0EA5A0] mt-1 line-clamp-1">{v.summary}</p>}
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] bg-[#E0F7F6] text-[#0EA5A0] px-2 py-0.5 rounded-full">{v.category}</span>
                  <div className="flex gap-2">
                    <a
                      href={`https://www.youtube.com/watch?v=${v.videoId}`}
                      target="_blank" rel="noopener noreferrer"
                      className="text-xs text-blue-500 hover:underline"
                    >
                      보기
                    </a>
                    <button onClick={() => handleDelete(v.id)} className="text-xs text-red-400 hover:text-red-600">
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
