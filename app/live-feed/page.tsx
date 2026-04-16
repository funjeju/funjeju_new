'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { LiveFeed } from '@/types';
import Image from 'next/image';
import Link from 'next/link';

interface LiveFeedEx extends LiveFeed {
  freshScore?: number;
  freshLabel?: string;
  exifTakenAt?: { seconds: number };
}

const CTA_ICONS: Record<string, string> = {
  visit: '📍', call: '📞', menu: '🍽', reserve: '📅',
};

function freshColor(score: number) {
  if (score >= 80) return 'bg-red-500';
  if (score >= 60) return 'bg-orange-400';
  return 'bg-gray-400';
}

function formatExifTime(ts?: { seconds: number }) {
  if (!ts) return null;
  const d = new Date(ts.seconds * 1000);
  return d.toLocaleString('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function FeedCard({ feed }: { feed: LiveFeedEx }) {
  const score = feed.freshScore ?? 100;
  const label = feed.freshLabel ?? 'LIVE';
  const exifTime = formatExifTime(feed.exifTakenAt as { seconds: number } | undefined);

  function handleCTA() {
    if (feed.ctaType === 'call' && feed.ctaPhone) window.location.href = `tel:${feed.ctaPhone}`;
    else if (feed.ctaUrl) window.open(feed.ctaUrl, '_blank');
  }

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-[#E2E8F0]">
      {/* 사진 + EXIF 오버레이 */}
      <div className="relative aspect-[4/3] bg-gray-100">
        {feed.photoUrl ? (
          <Image src={feed.photoUrl} alt={feed.businessName} fill className="object-cover" unoptimized />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-200 text-5xl">📷</div>
        )}

        {/* 상단: freshScore 뱃지 + 지역 */}
        <div className="absolute top-0 left-0 right-0 flex items-start justify-between p-3">
          <div className={`flex items-center gap-1.5 ${freshColor(score)} text-white text-xs font-bold px-2.5 py-1 rounded-full shadow`}>
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            {label}
          </div>
          {feed.region && (
            <div className="bg-black/50 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full">
              📍 {feed.region}
            </div>
          )}
        </div>

        {/* 하단: EXIF 정보 레이어 */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4">
          {/* 업체명 */}
          <p className="text-white font-bold text-base leading-tight mb-1">{feed.businessName}</p>

          {/* EXIF 메타 */}
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mb-2">
            {exifTime && (
              <span className="text-white/80 text-xs flex items-center gap-1">
                🕐 {exifTime} 촬영
              </span>
            )}
            {feed.exifLat && feed.exifLng && (
              <span className="text-white/80 text-xs flex items-center gap-1">
                🌐 {Number(feed.exifLat).toFixed(4)}, {Number(feed.exifLng).toFixed(4)}
              </span>
            )}
          </div>

          {/* AI 생성 캡션 */}
          {feed.caption && (
            <p className="text-white/90 text-xs leading-relaxed line-clamp-2 mb-3">{feed.caption}</p>
          )}

          {/* CTA 버튼 */}
          <button
            onClick={handleCTA}
            className="w-full py-2.5 bg-white text-[#0EA5A0] rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 hover:bg-[#E0F7F6] transition-colors"
          >
            <span>{CTA_ICONS[feed.ctaType] ?? '👉'}</span>
            <span>{feed.ctaLabel}</span>
          </button>
        </div>
      </div>

      {/* 신선도 프로그레스바 */}
      <div className="h-1 bg-gray-100">
        <div
          className={`h-full ${freshColor(score)} transition-all`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-[#E2E8F0] animate-pulse">
      <div className="aspect-[4/3] bg-gray-200" />
      <div className="h-1 bg-gray-100" />
    </div>
  );
}

export default function LiveFeedPage() {
  const [feeds, setFeeds] = useState<LiveFeedEx[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDocs(
          query(
            collection(db, 'live_feeds'),
            where('isApproved', '==', true),
            orderBy('createdAt', 'desc'),
            limit(30)
          )
        );
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as LiveFeedEx));
        // 클라이언트에서 freshScore 0 필터링
        setFeeds(items.filter(f => (f.freshScore ?? 100) > 0));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-[#1A2F4B]">🔴 Live 피드</h1>
          <p className="text-xs text-[#64748B] mt-0.5">소상공인이 방금 찍은 제주 현장</p>
        </div>
        <Link
          href="/partner/upload"
          className="flex items-center gap-1.5 px-4 py-2 bg-[#0EA5A0] text-white rounded-xl text-sm font-semibold hover:bg-[#0D7A76] transition-colors"
        >
          <span>📸</span>
          <span>사진 올리기</span>
        </Link>
      </div>

      {/* 피드 그리드 */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : feeds.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-5xl mb-3">📷</p>
          <p className="text-[#1A2F4B] font-semibold mb-1">아직 피드가 없어요</p>
          <p className="text-sm text-[#64748B] mb-6">소상공인 파트너가 사진을 올리면 여기에 실시간으로 표시됩니다</p>
          <Link
            href="/partner/upload"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#0EA5A0] text-white rounded-xl font-semibold"
          >
            📸 첫 번째 피드 올리기
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {feeds.map(f => <FeedCard key={f.id} feed={f} />)}
        </div>
      )}

      {/* 파트너 안내 */}
      <div className="mt-8 bg-[#F0FDF9] border border-[#0EA5A0]/20 rounded-2xl p-5">
        <p className="font-semibold text-[#1A2F4B] mb-1">📸 소상공인 파트너 안내</p>
        <p className="text-sm text-[#64748B] mb-3">
          스마트폰으로 찍은 사진 한 장만 올리면 — GPS 위치 자동 인식, AI 콘텐츠 자동 생성, CTA 버튼 자동 생성까지 한번에!
        </p>
        <ul className="text-xs text-[#64748B] space-y-1 mb-4">
          <li>✅ GPS 포함 사진 → 즉시 자동 등록</li>
          <li>✅ 12시간 신선도 기반 자동 정렬</li>
          <li>✅ Gemini AI가 사진 보고 자동 문구 생성</li>
        </ul>
        <Link
          href="/partner/upload"
          className="w-full block text-center py-3 bg-[#0EA5A0] text-white rounded-xl font-semibold text-sm"
        >
          지금 사진 올리기 →
        </Link>
      </div>
    </div>
  );
}
