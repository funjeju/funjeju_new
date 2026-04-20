'use client';

import Link from 'next/link';
import { Geocache } from '@/types';
import { formatDistance, getDistanceMeters } from '@/lib/utils/gps';

const TYPE_META: Record<string, { icon: string; label: string; color: string }> = {
  traditional: { icon: '📦', label: '전통', color: 'bg-green-100 text-green-700' },
  multi:        { icon: '🔗', label: '멀티', color: 'bg-blue-100 text-blue-700' },
  mystery:      { icon: '❓', label: '수수께끼', color: 'bg-purple-100 text-purple-700' },
  virtual:      { icon: '👁', label: '가상', color: 'bg-gray-100 text-gray-600' },
  earthcache:   { icon: '🌍', label: '자연', color: 'bg-emerald-100 text-emerald-700' },
  challenge:    { icon: '🏆', label: '챌린지', color: 'bg-yellow-100 text-yellow-700' },
};

const SIZE_LABEL: Record<string, string> = {
  nano: '극소', micro: '소형', small: '중소', regular: '보통', large: '대형', virtual: '가상', other: '기타',
};

function DiffBar({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] text-[#64748B] w-8">{label}</span>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i}
            className={`w-3 h-1.5 rounded-full ${i <= value ? 'bg-[#0EA5A0]' : 'bg-[#E2E8F0]'}`} />
        ))}
      </div>
      <span className="text-[10px] text-[#64748B]">{value.toFixed(1)}</span>
    </div>
  );
}

interface Props {
  cache: Geocache;
  userLat?: number;
  userLng?: number;
  foundCacheIds?: Set<string>;
}

export default function GeocacheCard({ cache, userLat, userLng, foundCacheIds }: Props) {
  const meta = TYPE_META[cache.type] ?? TYPE_META.traditional;
  const isFound = foundCacheIds?.has(cache.id) ?? false;

  const distM = userLat && userLng
    ? getDistanceMeters(userLat, userLng, cache.lat, cache.lng)
    : null;

  return (
    <Link href={`/geocaching/${cache.id}`}>
      <div className={`bg-white border rounded-2xl p-4 hover:shadow-md transition-shadow relative overflow-hidden ${
        isFound ? 'border-[#0EA5A0] bg-[#F0FDF9]' : 'border-[#E2E8F0]'
      }`}>
        {/* 발견 뱃지 */}
        {isFound && (
          <span className="absolute top-3 right-3 text-xs bg-[#0EA5A0] text-white px-2 py-0.5 rounded-full font-medium">
            ✅ 발견
          </span>
        )}

        {/* 상단 */}
        <div className="flex items-start gap-3 mb-3">
          <span className="text-2xl">{meta.icon}</span>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[#1A2F4B] text-sm truncate">{cache.title}</p>
            <p className="text-xs text-[#64748B] mt-0.5 line-clamp-1">{cache.region} · {cache.description}</p>
          </div>
        </div>

        {/* 타입 + 사이즈 뱃지 */}
        <div className="flex items-center gap-1.5 mb-2.5 flex-wrap">
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${meta.color}`}>
            {meta.label}
          </span>
          <span className="text-[10px] bg-[#F1F5F9] text-[#64748B] px-2 py-0.5 rounded-full">
            {SIZE_LABEL[cache.size]}
          </span>
          {cache.hasGift && (
            <span className="text-[10px] bg-[#FFF7ED] text-orange-600 px-2 py-0.5 rounded-full">
              🎁 선물있음
            </span>
          )}
          {cache.linkedOreumId && (
            <span className="text-[10px] bg-[#E0F7F6] text-[#0EA5A0] px-2 py-0.5 rounded-full">
              🌿 오름연계
            </span>
          )}
          {cache.linkedMissionId && (
            <span className="text-[10px] bg-[#FEF3C7] text-amber-700 px-2 py-0.5 rounded-full">
              🎯 미션연계
            </span>
          )}
        </div>

        {/* 난이도/지형 */}
        <div className="space-y-1 mb-3">
          <DiffBar value={cache.difficulty} label="난이도" />
          <DiffBar value={cache.terrain} label="지형" />
        </div>

        {/* 하단: 통계 + 거리 */}
        <div className="flex items-center justify-between text-[11px] text-[#64748B]">
          <div className="flex items-center gap-3">
            <span>✅ {cache.foundCount}회</span>
            <span>⭐ {cache.favoriteCount}</span>
            {cache.trackableIds.length > 0 && (
              <span>🐛 {cache.trackableIds.length}</span>
            )}
          </div>
          {distM !== null && (
            <span className="text-[#0EA5A0] font-medium">{formatDistance(distM)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
