'use client';

import { useGPS } from '@/hooks/useGPS';
import { getDistanceMeters, formatDistance } from '@/lib/utils/gps';

interface Props {
  targetLat: number;
  targetLng: number;
  radiusMeters?: number;
  onVerify: () => void;
  disabled?: boolean;
}

export default function GPSVerifyButton({ targetLat, targetLng, radiusMeters = 50, onVerify, disabled }: Props) {
  const { position, loading, error } = useGPS(true);

  if (loading) return (
    <button disabled className="w-full py-4 bg-gray-200 text-gray-500 rounded-xl text-sm animate-pulse">GPS 위치 확인 중...</button>
  );

  if (error) return (
    <button disabled className="w-full py-4 bg-gray-100 text-gray-500 rounded-xl text-sm">GPS 사용 불가: {error}</button>
  );

  if (!position) return null;

  const dist = getDistanceMeters(position.lat, position.lng, targetLat, targetLng);
  const inRange = dist <= radiusMeters;

  if (inRange) return (
    <button onClick={onVerify} disabled={disabled}
      className="w-full py-4 bg-[#22C55E] text-white rounded-xl text-base font-bold animate-pulse hover:bg-green-600 transition-colors disabled:opacity-50">
      ✅ 지금 인증하기
    </button>
  );

  return (
    <button disabled className="w-full py-4 bg-gray-100 text-[#64748B] rounded-xl text-sm">
      목적지까지 {formatDistance(dist)} 남았어요 📍
    </button>
  );
}
