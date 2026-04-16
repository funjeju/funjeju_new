'use client';

import { useState, useRef, useEffect } from 'react';
import { useChatStore } from '@/store/chatStore';
import { useGPS } from '@/hooks/useGPS';

export default function ChatPanel({ onClose }: { onClose: () => void }) {
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
    <div className="flex flex-col h-full bg-white">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#E2E8F0]">
        <div className="flex items-center gap-2">
          <span className="text-lg">🤖</span>
          <span className="font-semibold text-[#1A2F4B] text-sm">제주 AI 가이드</span>
        </div>
        <button onClick={onClose} className="text-[#64748B] text-lg">✕</button>
      </div>

      {/* 메시지 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <p className="text-3xl mb-2">🌊</p>
            <p className="text-sm text-[#64748B]">제주 어디든 물어보세요!</p>
            <div className="mt-4 space-y-2">
              {quickQuestions.map(q => (
                <button key={q} onClick={() => { setInput(q); }}
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

      {/* 입력 */}
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
    </div>
  );
}
