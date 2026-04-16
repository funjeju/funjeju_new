'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { CCTVLocation, LiveFeed, Mission, Oreum } from '@/types';
import LiveBadge from '@/components/ui/LiveBadge';
import Link from 'next/link';
import Image from 'next/image';

// ──────────────────────────────────────
// 스켈레톤
// ──────────────────────────────────────
function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded-lg ${className}`} />;
}

// ──────────────────────────────────────
// Hero 섹션
// ──────────────────────────────────────
function HeroSection({ cctv }: { cctv: CCTVLocation | null }) {
  if (!cctv) {
    return <Skeleton className="w-full aspect-video max-h-[480px]" />;
  }

  function openStream() {
    const url = cctv?.ubinWrId
      ? `http://ubin.onpr.co.kr/bbs/board.php?bo_table=cctv&wr_id=${cctv.ubinWrId}`
      : 'http://ubin.onpr.co.kr/bbs/board.php?bo_table=cctv';
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  return (
    <div className="relative w-full aspect-video max-h-[480px] bg-gray-900 overflow-hidden rounded-b-2xl md:rounded-2xl flex flex-col items-center justify-center gap-4">
      {/* 배경 그라디언트 */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0EA5A0]/30 to-[#1A2F4B]/80" />

      <div className="relative z-10 flex flex-col items-center gap-3 text-center px-6">
        <div className="flex items-center gap-2">
          <LiveBadge />
          <span className="text-white font-semibold text-lg drop-shadow">{cctv.name}</span>
        </div>
        <p className="text-white/60 text-sm">{cctv.region} · 제주도 공식 CCTV</p>
        <button
          onClick={openStream}
          className="mt-2 px-6 py-3 bg-[#0EA5A0] text-white rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-[#0D7A76] transition-colors shadow-lg"
        >
          📺 실시간 영상 보기
        </button>
      </div>

      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between z-10">
        <span className="text-white/60 text-xs">📡 새 창에서 재생됩니다</span>
        <Link
          href="/map"
          className="text-white text-xs bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full hover:bg-white/30 transition-colors"
        >
          지도에서 보기 →
        </Link>
      </div>
    </div>
  );
}

// ──────────────────────────────────────
// Live 피드 카드 (소상공인 사진 + CTA)
// ──────────────────────────────────────
const CTA_ICONS: Record<string, string> = {
  visit: '📍', call: '📞', menu: '🍽', reserve: '📅',
};

// LiveFeed에 freshScore/freshLabel이 추가됨
interface LiveFeedEx extends LiveFeed {
  freshScore?: number;
  freshLabel?: string;
}

function LiveFeedCard({ feed }: { feed: LiveFeedEx }) {
  function handleCTA(e: React.MouseEvent) {
    e.stopPropagation();
    if (feed.ctaType === 'call' && feed.ctaPhone) {
      window.location.href = `tel:${feed.ctaPhone}`;
    } else if (feed.ctaUrl) {
      window.open(feed.ctaUrl, '_blank');
    }
  }

  const freshLabel = feed.freshLabel ?? null;
  const isFresh = (feed.freshScore ?? 100) >= 80;

  return (
    <div className="rounded-xl overflow-hidden bg-white border border-[#E2E8F0] hover:shadow-md transition-shadow">
      {/* 사진 */}
      <div className="relative aspect-[4/3] bg-gray-100">
        {feed.photoUrl ? (
          <Image src={feed.photoUrl} alt={feed.businessName} fill className="object-cover" unoptimized />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-3xl">📷</div>
        )}
        {/* 신선도 뱃지 */}
        <div className="absolute top-2 left-2 flex items-center gap-1 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
          <span className={`w-1.5 h-1.5 bg-white rounded-full ${isFresh ? 'animate-pulse' : ''}`} />
          {freshLabel ?? 'LIVE'}
        </div>
        {feed.region && (
          <span className="absolute top-2 right-2 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full">
            📍 {feed.region}
          </span>
        )}
      </div>

      {/* 정보 + CTA */}
      <div className="p-3">
        <p className="text-sm font-semibold text-[#1A2F4B] truncate">{feed.businessName}</p>
        {feed.caption && <p className="text-xs text-[#64748B] mt-0.5 line-clamp-2">{feed.caption}</p>}
        <button
          onClick={handleCTA}
          className="mt-2 w-full py-1.5 bg-[#0EA5A0] text-white text-xs font-semibold rounded-lg hover:bg-[#0D7A76] transition-colors flex items-center justify-center gap-1"
        >
          <span>{CTA_ICONS[feed.ctaType]}</span>
          <span>{feed.ctaLabel}</span>
        </button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────
// 미션 카드
// ──────────────────────────────────────
function MissionCard({ mission }: { mission: Mission }) {
  return (
    <Link href={`/missions/${mission.id}`}>
      <div className="min-w-[200px] rounded-xl overflow-hidden bg-white border border-[#E2E8F0] hover:shadow-md transition-shadow">
        <div className="relative h-28 bg-[#F59E0B]/10 flex items-center justify-center">
          {mission.thumbnailUrl ? (
            <Image src={mission.thumbnailUrl} alt={mission.title} fill className="object-cover" />
          ) : (
            <span className="text-3xl">🎯</span>
          )}
        </div>
        <div className="p-3">
          <p className="text-sm font-semibold text-[#1A2F4B] line-clamp-2">{mission.title}</p>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-xs text-[#64748B]">
              {'★'.repeat(mission.difficulty)}{'☆'.repeat(5 - mission.difficulty)}
            </span>
            <span className="text-xs text-[#64748B]">· {mission.estimatedMinutes}분</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ──────────────────────────────────────
// 오름 카드
// ──────────────────────────────────────
function OreumCard({ oreum }: { oreum: Oreum }) {
  return (
    <Link href={`/oreums/${oreum.id}`}>
      <div className="rounded-xl overflow-hidden bg-white border border-[#E2E8F0] hover:shadow-md transition-shadow">
        <div className="relative h-32 bg-[#4CAF50]/10">
          {oreum.thumbnailUrl ? (
            <Image src={oreum.thumbnailUrl} alt={oreum.name} fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl">🌿</div>
          )}
        </div>
        <div className="p-3">
          <p className="text-sm font-semibold text-[#1A2F4B]">{oreum.name}</p>
          <p className="text-xs text-[#64748B] mt-0.5">{oreum.region} · {oreum.altitude}m</p>
          <div className="flex gap-1 mt-1 flex-wrap">
            {oreum.tags.slice(0, 2).map(tag => (
              <span key={tag} className="text-[10px] bg-[#E0F7F6] text-[#0EA5A0] px-1.5 py-0.5 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}

// ──────────────────────────────────────
// 메인 페이지
// ──────────────────────────────────────
export default function HomePage() {
  const [heroCctv, setHeroCctv] = useState<CCTVLocation | null>(null);
  const [liveFeeds, setLiveFeeds] = useState<LiveFeed[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [oreums, setOreums] = useState<Oreum[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const cctvSnap = await getDocs(
          query(collection(db, 'cctv_locations'), where('isActive', '==', true))
        );
        const cctvList = cctvSnap.docs.map(d => ({ id: d.id, ...d.data() } as CCTVLocation));
        if (cctvList.length > 0) {
          setHeroCctv(cctvList[Math.floor(Math.random() * cctvList.length)]);
        }

        const feedSnap = await getDocs(
          query(
            collection(db, 'live_feeds'),
            where('isApproved', '==', true),
            orderBy('freshScore', 'desc'),
            orderBy('createdAt', 'desc'),
            limit(12)
          )
        );
        setLiveFeeds(feedSnap.docs.map(d => ({ id: d.id, ...d.data() } as LiveFeed)));

        const missionSnap = await getDocs(
          query(
            collection(db, 'missions'),
            where('isPublished', '==', true),
            orderBy('createdAt', 'desc'),
            limit(6)
          )
        );
        setMissions(missionSnap.docs.map(d => ({ id: d.id, ...d.data() } as Mission)));

        const oreumSnap = await getDocs(
          query(collection(db, 'oreums'), where('isPublished', '==', true), limit(3))
        );
        setOreums(oreumSnap.docs.map(d => ({ id: d.id, ...d.data() } as Oreum)));
      } catch (e) {
        console.error('데이터 로드 실패:', e);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <div className="max-w-2xl mx-auto md:max-w-5xl px-4 py-4 space-y-8">

      {/* Hero */}
      <section>
        <HeroSection cctv={heroCctv} />
      </section>

      {/* Live 피드 */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-[#1A2F4B]">지금 제주 Live 피드</h2>
          <Link href="/map" className="text-xs text-[#0EA5A0]">전체보기</Link>
        </div>
        {loading || liveFeeds.length === 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="aspect-video" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {liveFeeds.slice(0, 8).map(feed => <LiveFeedCard key={feed.id} feed={feed} />)}
          </div>
        )}
      </section>

      {/* 이번 주 미션 */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-[#1A2F4B]">이번 주 미션</h2>
          <Link href="/missions" className="text-xs text-[#0EA5A0]">전체보기</Link>
        </div>
        {loading || missions.length === 0 ? (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="min-w-[200px] h-40 flex-shrink-0" />
            ))}
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {missions.map(m => <MissionCard key={m.id} mission={m} />)}
          </div>
        )}
      </section>

      {/* 오름 스탬프 Pick */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-[#1A2F4B]">오름 스탬프 Pick</h2>
          <Link href="/oreums" className="text-xs text-[#0EA5A0]">도감 보기</Link>
        </div>
        {loading || oreums.length === 0 ? (
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-44" />)}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {oreums.map(o => <OreumCard key={o.id} oreum={o} />)}
          </div>
        )}
      </section>

    </div>
  );
}
