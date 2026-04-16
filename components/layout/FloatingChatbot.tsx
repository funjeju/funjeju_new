'use client';

import { useState } from 'react';
import { useChatStore } from '@/store/chatStore';
import ChatPanel from '@/components/chat/ChatPanel';

export default function FloatingChatbot() {
  const { isOpen, setOpen } = useChatStore();

  return (
    <>
      {/* 플로팅 버튼 */}
      {!isOpen && (
        <button onClick={() => setOpen(true)}
          className="fixed bottom-20 right-4 md:bottom-6 z-40 w-14 h-14 bg-[#0EA5A0] text-white rounded-full shadow-lg flex items-center justify-center text-2xl hover:bg-[#0D7A76] transition-colors">
          🤖
        </button>
      )}

      {/* 모바일: 하단 슬라이드업 */}
      {isOpen && (
        <>
          <div className="md:hidden fixed inset-0 z-40 bg-black/30" onClick={() => setOpen(false)} />
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-[80vh] rounded-t-2xl overflow-hidden shadow-2xl">
            <ChatPanel onClose={() => setOpen(false)} />
          </div>
        </>
      )}

      {/* PC: 우측 드로어 */}
      {isOpen && (
        <div className="hidden md:block fixed right-0 top-16 bottom-0 z-40 w-96 shadow-2xl border-l border-[#E2E8F0]">
          <ChatPanel onClose={() => setOpen(false)} />
        </div>
      )}
    </>
  );
}
