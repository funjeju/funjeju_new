'use client';

import { useState, useRef, useEffect } from 'react';
import { useChatStore } from '@/store/chatStore';
import { useGPS } from '@/hooks/useGPS';

// ── 날씨캐스터 탭 ──────────────────────────────
function WeatherTab() {
  const [weather, setWeather] = useState<{
    briefing: string;
    kmaData: { temp: number; humidity: number; windSpeed: number; windDir: string; rainProb: number };
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/weather?cctvId=jejusi-tapdonggwangjang')
      .then(r => r.json())
      .then(d => setWeather(d))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {/* 브리핑 */}
      <div className="bg-gradient-to-br from-[#0EA5A0] to-[#0D7A76] rounded-2xl p-5 text-white">
        <p className="text-xs opacity-70 mb-2">🌤 제주 실시간 날씨 AI 브리핑</p>
        {loading ? (
          <div className="space-y-2 animate-pulse">
            <div className="h-3 bg-white/20 rounded w-full" />
            <div className="h-3 bg-white/20 rounded w-4/5" />
            <div className="h-3 bg-white/20 rounded w-3/5" />
          </div>
        ) : (
          <p className="text-sm leading-relaxed">{weather?.briefing ?? '날씨 정보를 불러오는 중...'}</p>
        )}
      </div>

      {/* 수치 */}
      {weather && (
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: '기온', value: `${weather.kmaData.temp}°C`, icon: '🌡' },
            { label: '습도', value: `${weather.kmaData.humidity}%`, icon: '💧' },
            { label: '바람', value: `${weather.kmaData.windDir} ${weather.kmaData.windSpeed}m/s`, icon: '💨' },
            { label: '강수확률', value: `${weather.kmaData.rainProb}%`, icon: '🌧' },
          ].map(s => (
            <div key={s.label} className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 text-center">
              <p className="text-xl mb-1">{s.icon}</p>
              <p className="font-bold text-[#1A2F4B] text-sm">{s.value}</p>
              <p className="text-xs text-[#64748B]">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* 오름 추천 */}
      <div className="bg-[#F0FDF9] border border-[#0EA5A0]/20 rounded-xl p-4">
        <p className="text-sm font-semibold text-[#1A2F4B] mb-1">🌿 오늘 날씨 오름 추천</p>
        <p className="text-xs text-[#64748B]">
          {weather?.kmaData.rainProb !== undefined && weather.kmaData.rainProb < 30
            ? '날씨가 좋아요! 새별오름·다랑쉬오름 강력 추천 🌟'
            : '비 올 수 있어요. 짧은 코스 오름이나 실내 관광을 추천해요 ☂️'}
        </p>
      </div>

      <button
        onClick={() => fetch('/api/weather?cctvId=jejusi-tapdonggwangjang').then(r => r.json()).then(d => setWeather(d))}
        className="w-full py-2.5 border border-[#E2E8F0] rounded-xl text-xs text-[#64748B] hover:bg-[#F8FAFC]"
      >
        🔄 날씨 새로고침
      </button>
    </div>
  );
}

// ── 도슨트 AI 탭 ──────────────────────────────
function DocentTab() {
  const { messages, addMessage, loading, setLoading } = useChatStore();
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const { position } = useGPS();

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    addMessage({ role: 'user', content: text });
    setLoading(true);

    const history = messages.map(m => ({
      role: m.role === 'user' ? 'user' : 'model' as const,
      parts: [{ text: m.content }],
    }));

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...history, { role: 'user', parts: [{ text }] }],
          userLat: position?.lat,
          userLng: position?.lng,
        }),
      });
      const { reply } = await res.json();
      addMessage({ role: 'assistant', content: reply || '죄송해요, 다시 시도해주세요.' });
    } catch {
      addMessage({ role: 'assistant', content: '연결에 문제가 생겼어요. 잠시 후 다시 시도해주세요.' });
    } finally {
      setLoading(false);
    }
  }

  const quickQuestions = ['오늘 날씨에 맞는 오름 추천해줘', '지금 내 주변 맛집 알려줘', '3박 4일 제주 동선 짜줘'];

  return (
    <>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <p className="text-3xl mb-2">🌊</p>
            <p className="text-sm text-[#64748B]">제주 어디든 물어보세요!</p>
            <div className="mt-4 space-y-2">
              {quickQuestions.map(q => (
                <button key={q} onClick={() => setInput(q)}
                  className="block w-full text-left text-xs bg-[#E0F7F6] text-[#0EA5A0] px-3 py-2 rounded-lg hover:bg-[#0EA5A0] hover:text-white transition-colors">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map(m => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
              m.role === 'user'
                ? 'bg-[#0EA5A0] text-white rounded-br-sm'
                : 'bg-[#F8FAFC] text-[#1A2F4B] rounded-bl-sm border border-[#E2E8F0]'
            }`}>
              <p className="whitespace-pre-wrap">{m.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl rounded-bl-sm px-4 py-2.5">
              <div className="flex gap-1">
                {[0, 1, 2].map(i => <span key={i} className="w-1.5 h-1.5 bg-[#0EA5A0] rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="px-4 py-3 border-t border-[#E2E8F0]">
        <div className="flex gap-2">
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="제주에 대해 물어보세요..." disabled={loading}
            className="flex-1 border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#0EA5A0]" />
          <button onClick={send} disabled={loading || !input.trim()}
            className="px-4 py-2.5 bg-[#0EA5A0] text-white rounded-xl text-sm font-medium disabled:opacity-50">전송</button>
        </div>
      </div>
    </>
  );
}

// ── 메인 패널 ──────────────────────────────────
export default function ChatPanel({ onClose }: { onClose: () => void }) {
  const { activeTab, setTab } = useChatStore();

  const tabs = [
    { key: 'docent' as const, label: '🤖 도슨트 AI' },
    { key: 'weather' as const, label: '🌤 날씨캐스터' },
  ];

  return (
    <div className="flex flex-col h-full bg-white">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#E2E8F0]">
        <span className="font-semibold text-[#1A2F4B] text-sm">
          {activeTab === 'docent' ? '🤖 제주 도슨트 AI' : '🌤 날씨캐스터 AI'}
        </span>
        <button onClick={onClose} className="text-[#64748B] text-lg leading-none">✕</button>
      </div>

      {/* 콘텐츠 */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {activeTab === 'docent' ? <DocentTab /> : <WeatherTab />}
      </div>

      {/* 하단 탭 */}
      <div className="flex border-t border-[#E2E8F0]">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              activeTab === t.key
                ? 'text-[#0EA5A0] border-t-2 border-[#0EA5A0] -mt-[2px]'
                : 'text-[#94A3B8] hover:text-[#64748B]'
            }`}>
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
