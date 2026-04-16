'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { CCTVLocation } from '@/types';

interface WeatherData {
  cctvId: string;
  briefing: string;
  kmaData: { temp: number; humidity: number; windSpeed: number; windDir: string; rainProb: number };
}

export default function WeatherPage() {
  const [cctvList, setCctvList] = useState<CCTVLocation[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [selectedId, setSelectedId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDocs(query(collection(db, 'cctv_locations'), where('isActive', '==', true)))
      .then(snap => {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as CCTVLocation));
        setCctvList(list);
        if (list.length > 0) setSelectedId(list[0].id);
      });
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    setLoading(true);
    fetch(`/api/weather?cctvId=${selectedId}`)
      .then(r => r.json())
      .then(d => setWeather(d))
      .finally(() => setLoading(false));
  }, [selectedId]);

  const selected = cctvList.find(c => c.id === selectedId);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <h1 className="text-xl font-bold text-[#1A2F4B]">🌤 제주 실시간 날씨</h1>

      {/* CCTV 선택 */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {cctvList.slice(0, 10).map(c => (
          <button key={c.id} onClick={() => setSelectedId(c.id)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedId === c.id ? 'bg-[#0EA5A0] text-white' : 'bg-white border border-[#E2E8F0] text-[#64748B]'
            }`}>{c.name}</button>
        ))}
      </div>

      {/* 날씨 브리핑 카드 */}
      <div className="bg-gradient-to-br from-[#0EA5A0] to-[#0D7A76] rounded-2xl p-6 text-white">
        <p className="text-sm opacity-80 mb-1">{selected?.name ?? ''}</p>
        {loading ? (
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-white/20 rounded w-3/4" />
            <div className="h-4 bg-white/20 rounded w-1/2" />
          </div>
        ) : (
          <p className="text-base leading-relaxed">{weather?.briefing ?? '날씨 정보를 불러오는 중...'}</p>
        )}
      </div>

      {/* 수치 정보 */}
      {weather && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: '기온', value: `${weather.kmaData.temp}°C`, icon: '🌡' },
            { label: '습도', value: `${weather.kmaData.humidity}%`, icon: '💧' },
            { label: '바람', value: `${weather.kmaData.windDir} ${weather.kmaData.windSpeed}m/s`, icon: '💨' },
            { label: '강수확률', value: `${weather.kmaData.rainProb}%`, icon: '🌧' },
          ].map(s => (
            <div key={s.label} className="bg-white border border-[#E2E8F0] rounded-xl p-4 text-center">
              <p className="text-xl mb-1">{s.icon}</p>
              <p className="font-bold text-[#1A2F4B]">{s.value}</p>
              <p className="text-xs text-[#64748B]">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* 오름 추천 */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5">
        <h2 className="font-semibold text-[#1A2F4B] mb-2">🌿 오늘 날씨 오름 추천</h2>
        <p className="text-sm text-[#64748B]">
          {weather?.kmaData.rainProb && weather.kmaData.rainProb < 30
            ? '날씨가 좋아요! 새별오름·다랑쉬오름 강력 추천 🌟'
            : '비 올 수 있어요. 실내 관광 또는 짧은 오름 코스를 추천해요 ☂️'}
        </p>
      </div>
    </div>
  );
}
