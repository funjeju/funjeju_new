'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import Image from 'next/image';

interface Video {
  id: string;
  videoId: string;
  title: string;
  channelName: string;
  thumbnail: string;
  publishedAt: string;
  category: string;
  summary?: string;
  viewCount?: number;
}

const CATEGORIES = ['전체', '여행', '맛집', '자연', '문화', '액티비티'];

const SAMPLE_VIDEOS: Video[] = [
  {
    id: '1', videoId: 'dQw4w9WgXcQ', title: '제주도 오름 트레킹 완벽 가이드 | 성산일출봉부터 한라산까지',
    channelName: '제주여행TV', thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    publishedAt: '2024-03-15', category: '자연', viewCount: 124000,
    summary: '제주도 대표 오름들을 트레킹하는 완벽한 가이드입니다. 초보자도 쉽게 도전할 수 있는 코스부터 고급 코스까지 다양하게 소개합니다.',
  },
  {
    id: '2', videoId: 'jNQXAC9IVRw', title: '제주 흑돼지 맛집 TOP 10 | 현지인 추천 맛집 총정리',
    channelName: '제주맛집탐방', thumbnail: 'https://i.ytimg.com/vi/jNQXAC9IVRw/hqdefault.jpg',
    publishedAt: '2024-03-10', category: '맛집', viewCount: 89000,
    summary: '제주 현지인들이 즐겨 찾는 흑돼지 맛집 10곳을 직접 방문해 리뷰했습니다. 가격 대비 맛있는 집을 꼭 확인해 보세요.',
  },
  {
    id: '3', videoId: 'M7lc1UVf-VE', title: '제주 카페 투어 | 인스타 핫플 카페 모음',
    channelName: '제주라이프', thumbnail: 'https://i.ytimg.com/vi/M7lc1UVf-VE/hqdefault.jpg',
    publishedAt: '2024-03-05', category: '여행', viewCount: 67000,
    summary: '제주도 SNS에서 화제가 된 카페들을 직접 방문해 분위기와 메뉴를 소개합니다.',
  },
  {
    id: '4', videoId: 'kJQP7kiw5Fk', title: '제주 서핑 입문 가이드 | 중문 해수욕장에서 배우는 서핑',
    channelName: '제주액티비티', thumbnail: 'https://i.ytimg.com/vi/kJQP7kiw5Fk/hqdefault.jpg',
    publishedAt: '2024-02-28', category: '액티비티', viewCount: 43000,
    summary: '제주 중문해수욕장에서 서핑을 배우는 과정을 담았습니다. 초보자를 위한 친절한 안내와 함께 제주 서핑 명소도 소개합니다.',
  },
  {
    id: '5', videoId: 'ZZ5LpwO-An4', title: '제주 해녀 문화 체험 | 100년의 전통을 만나다',
    channelName: '제주문화탐구', thumbnail: 'https://i.ytimg.com/vi/ZZ5LpwO-An4/hqdefault.jpg',
    publishedAt: '2024-02-20', category: '문화', viewCount: 52000,
    summary: '제주 해녀 할머니들과 함께하는 특별한 문화 체험. 유네스코 무형문화유산으로 등재된 해녀 문화의 가치를 알아봅니다.',
  },
  {
    id: '6', videoId: 'RgKAFK5djSk', title: '제주 한달살기 현실 | 렌트비·생활비 총정리',
    channelName: '제주살이', thumbnail: 'https://i.ytimg.com/vi/RgKAFK5djSk/hqdefault.jpg',
    publishedAt: '2024-02-15', category: '여행', viewCount: 178000,
    summary: '제주에서 한 달 살아보기! 실제 렌트비, 생활비, 추천 동네까지 솔직하게 공개합니다.',
  },
];

function formatCount(n?: number) {
  if (!n) return '';
  if (n >= 10000) return `${Math.floor(n / 10000)}만`;
  if (n >= 1000) return `${Math.floor(n / 1000)}천`;
  return String(n);
}

export default function JejuTubePage() {
  const [videos, setVideos] = useState<Video[]>(SAMPLE_VIDEOS);
  const [category, setCategory] = useState('전체');
  const [loading, setLoading] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  useEffect(() => {
    // Try to load from Firestore cache; fall back to samples
    getDocs(query(collection(db, 'jeju_tube_cache'), orderBy('publishedAt', 'desc'), limit(30)))
      .then(snap => {
        if (snap.docs.length > 0) {
          setVideos(snap.docs.map(d => ({ id: d.id, ...d.data() } as Video)));
        }
      })
      .catch(() => {/* use samples */});
  }, []);

  const filtered = category === '전체' ? videos : videos.filter(v => v.category === category);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">▶️</span>
        <h1 className="text-xl font-bold text-[#1A2F4B]">제주튜브</h1>
        <span className="text-xs bg-red-100 text-red-500 px-2 py-0.5 rounded-full font-medium ml-auto">AI 큐레이션</span>
      </div>

      {/* 카테고리 필터 */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCategory(c)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${category === c ? 'bg-red-500 text-white' : 'bg-white border border-[#E2E8F0] text-[#64748B]'}`}>
            {c}
          </button>
        ))}
      </div>

      {/* 영상 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(video => (
          <div key={video.id} onClick={() => setSelectedVideo(video)}
            className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden cursor-pointer hover:shadow-md transition-shadow">
            {/* 썸네일 */}
            <div className="relative aspect-video bg-gray-100">
              <Image
                src={video.thumbnail}
                alt={video.title}
                fill
                className="object-cover"
                unoptimized
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity">
                <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xl ml-1">▶</span>
                </div>
              </div>
              <span className="absolute top-2 right-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                {video.category}
              </span>
            </div>

            {/* 정보 */}
            <div className="p-3">
              <p className="text-sm font-semibold text-[#1A2F4B] line-clamp-2 mb-1">{video.title}</p>
              <div className="flex items-center justify-between text-xs text-[#64748B]">
                <span>{video.channelName}</span>
                {video.viewCount && <span>조회 {formatCount(video.viewCount)}회</span>}
              </div>

              {/* AI 요약 */}
              {video.summary && (
                <div className="mt-2 bg-[#F8FAFC] rounded-lg p-2">
                  <p className="text-xs text-[#64748B] line-clamp-2">
                    <span className="text-[#0EA5A0] font-medium">AI요약 · </span>
                    {video.summary}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-[#64748B]">
          <p className="text-3xl mb-2">▶️</p>
          <p className="text-sm">해당 카테고리의 영상이 없어요</p>
        </div>
      )}

      {/* 영상 플레이어 모달 */}
      {selectedVideo && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setSelectedVideo(null)}>
          <div className="w-full max-w-2xl" onClick={e => e.stopPropagation()}>
            <div className="aspect-video bg-black rounded-t-xl overflow-hidden">
              <iframe
                src={`https://www.youtube.com/embed/${selectedVideo.videoId}?autoplay=1`}
                className="w-full h-full"
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            </div>
            <div className="bg-white rounded-b-xl p-4">
              <p className="font-semibold text-[#1A2F4B] mb-1">{selectedVideo.title}</p>
              <p className="text-sm text-[#64748B] mb-2">{selectedVideo.channelName}</p>
              {selectedVideo.summary && (
                <div className="bg-[#E0F7F6] rounded-lg p-3">
                  <p className="text-xs text-[#0EA5A0] font-medium mb-1">AI 요약</p>
                  <p className="text-sm text-[#1A2F4B]">{selectedVideo.summary}</p>
                </div>
              )}
              <button onClick={() => setSelectedVideo(null)}
                className="w-full mt-3 py-2 text-sm text-[#64748B] border border-[#E2E8F0] rounded-xl">
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
