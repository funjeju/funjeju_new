'use client';

import { useEffect, useRef } from 'react';

declare global {
  interface Window { kakao: any; }
}

interface Marker {
  id: string;
  lat: number;
  lng: number;
  title: string;
  isActive?: boolean;
}

interface Props {
  markers?: Marker[];
  center?: { lat: number; lng: number };
  zoom?: number;
  onMarkerClick?: (id: string) => void;
  className?: string;
}

export default function KakaoMap({ markers = [], center = { lat: 33.38, lng: 126.55 }, zoom = 10, onMarkerClick, className = '' }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;
    if (!key) return;

    function init() {
      if (!containerRef.current || !window.kakao?.maps) return;
      const { maps } = window.kakao;
      const map = new maps.Map(containerRef.current, {
        center: new maps.LatLng(center.lat, center.lng),
        level: zoom,
      });
      mapRef.current = map;

      // 마커 제거
      markersRef.current.forEach(m => m.setMap(null));
      markersRef.current = [];

      markers.forEach(m => {
        const pos = new maps.LatLng(m.lat, m.lng);
        const overlay = new maps.CustomOverlay({
          position: pos,
          content: `<div style="background:${m.isActive !== false ? '#0EA5A0' : '#9CA3AF'};color:white;border-radius:8px;padding:4px 8px;font-size:11px;font-weight:600;white-space:nowrap;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.2)">📷 ${m.title}</div>`,
          yAnchor: 1.3,
        });
        overlay.setMap(map);
        if (onMarkerClick) {
          overlay.getContent()?.querySelector?.('div')?.addEventListener?.('click', () => onMarkerClick(m.id));
        }
        markersRef.current.push(overlay);
      });
    }

    if (window.kakao?.maps) { init(); return; }

    const script = document.createElement('script');
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&autoload=false`;
    script.onload = () => window.kakao.maps.load(init);
    document.head.appendChild(script);
  }, [markers, center, zoom, onMarkerClick]);

  const key = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;
  if (!key) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-xl ${className}`}>
        <p className="text-sm text-[#64748B]">카카오맵 API 키를 설정해주세요</p>
      </div>
    );
  }

  return <div ref={containerRef} className={`rounded-xl overflow-hidden ${className}`} />;
}
