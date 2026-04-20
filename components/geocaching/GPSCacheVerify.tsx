'use client';

import { useGPS } from '@/hooks/useGPS';
import { getDistanceMeters, formatDistance } from '@/lib/utils/gps';
import { CacheWaypoint } from '@/types';

interface SimpleVerifyProps {
  targetLat: number;
  targetLng: number;
  radiusMeters?: number;
  label?: string;
  onVerify: () => void;
  disabled?: boolean;
  alreadyFound?: boolean;
}

export function GPSCacheVerify({
  targetLat, targetLng, radiusMeters = 30,
  label = '이 위치에서 발견했어요!',
  onVerify, disabled, alreadyFound,
}: SimpleVerifyProps) {
  const { position, loading, error } = useGPS(true);

  if (alreadyFound) return (
    <div className="w-full py-4 bg-[#E0F7F6] border border-[#0EA5A0] rounded-xl text-center text-sm font-semibold text-[#0EA5A0]">
      ✅ 이미 발견한 캐시입니다
    </div>
  );

  if (loading) return (
    <div className="w-full py-4 bg-gray-100 rounded-xl text-center text-sm text-[#64748B] animate-pulse">
      📡 GPS 신호 확인 중...
    </div>
  );

  if (error) return (
    <div className="w-full py-4 bg-red-50 border border-red-200 rounded-xl text-center text-sm text-red-500">
      GPS 오류: {error}
    </div>
  );

  if (!position) return null;

  const dist = getDistanceMeters(position.lat, position.lng, targetLat, targetLng);
  const inRange = dist <= radiusMeters;
  const accuracy = position.accuracy;

  return (
    <div className="space-y-2">
      {/* 거리 게이지 */}
      <div className="flex items-center justify-between text-xs text-[#64748B] px-1">
        <span>📍 현재 위치</span>
        <span>목적지까지 <strong className={inRange ? 'text-green-600' : 'text-[#0EA5A0]'}>{formatDistance(dist)}</strong></span>
        <span>정확도 ±{Math.round(accuracy)}m</span>
      </div>

      {/* 프로그레스 바 */}
      <div className="w-full h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${inRange ? 'bg-green-500' : 'bg-[#0EA5A0]'}`}
          style={{ width: `${Math.max(5, Math.min(100, (1 - dist / 500) * 100))}%` }}
        />
      </div>

      {inRange ? (
        <button
          onClick={onVerify}
          disabled={disabled}
          className="w-full py-4 bg-[#22C55E] text-white rounded-xl text-base font-bold shadow-lg hover:bg-green-600 transition-colors disabled:opacity-50 animate-pulse"
        >
          🎉 {label}
        </button>
      ) : (
        <button disabled className="w-full py-4 bg-gray-100 text-[#64748B] rounded-xl text-sm">
          {formatDistance(dist)} 더 이동하면 인증 가능해요 →
        </button>
      )}
    </div>
  );
}

// 멀티캐시 웨이포인트 진행 컴포넌트
interface MultiVerifyProps {
  waypoints: CacheWaypoint[];
  completedWaypoints: number[];
  onWaypointVerify: (order: number) => void;
  disabled?: boolean;
}

export function MultiCacheVerify({ waypoints, completedWaypoints, onWaypointVerify, disabled }: MultiVerifyProps) {
  const { position, loading } = useGPS(true);
  const currentOrder = completedWaypoints.length + 1;
  const isComplete = completedWaypoints.length === waypoints.length;

  if (isComplete) return (
    <div className="bg-[#E0F7F6] border border-[#0EA5A0] rounded-xl p-4 text-center">
      <p className="text-2xl mb-1">🎉</p>
      <p className="font-bold text-[#0EA5A0]">모든 웨이포인트 완료!</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {waypoints.map((wp) => {
        const done = completedWaypoints.includes(wp.order);
        const isCurrent = wp.order === currentOrder;
        const dist = position ? getDistanceMeters(position.lat, position.lng, wp.lat, wp.lng) : null;
        const inRange = dist !== null && dist <= wp.radiusMeters;

        return (
          <div key={wp.order} className={`border rounded-xl p-3 transition-all ${
            done ? 'border-green-300 bg-green-50'
            : isCurrent ? 'border-[#0EA5A0] bg-[#F0FDF9]'
            : 'border-[#E2E8F0] bg-gray-50 opacity-50'
          }`}>
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                done ? 'bg-green-500 text-white' : isCurrent ? 'bg-[#0EA5A0] text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {done ? '✓' : wp.order}
              </span>
              <span className="font-medium text-sm text-[#1A2F4B]">{wp.label}</span>
              {dist !== null && isCurrent && (
                <span className="ml-auto text-xs text-[#0EA5A0] font-medium">{formatDistance(dist)}</span>
              )}
            </div>

            {isCurrent && (
              <>
                <p className="text-xs text-[#64748B] mb-2">{wp.description}</p>
                {wp.clue && done && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-xs text-amber-700 mb-2">
                    💡 단서: {wp.clue}
                  </div>
                )}
                {loading ? (
                  <p className="text-xs text-[#64748B] animate-pulse">GPS 확인 중...</p>
                ) : inRange ? (
                  <button
                    onClick={() => onWaypointVerify(wp.order)}
                    disabled={disabled}
                    className="w-full py-2.5 bg-[#22C55E] text-white rounded-lg text-sm font-bold animate-pulse disabled:opacity-50"
                  >
                    ✅ 웨이포인트 {wp.order} 인증
                  </button>
                ) : (
                  <p className="text-xs text-[#64748B]">
                    {dist !== null ? `${formatDistance(dist)} 더 이동해야 해요` : 'GPS 신호 없음'}
                  </p>
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
