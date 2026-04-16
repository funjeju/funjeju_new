'use client';

import { useRouter } from 'next/navigation';

interface Props {
  message?: string;
  onClose: () => void;
}

export default function LoginPrompt({ message = '이 기능을 사용하려면 로그인이 필요합니다.', onClose }: Props) {
  const router = useRouter();
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40" onClick={onClose}>
      <div className="w-full max-w-sm bg-white rounded-t-2xl md:rounded-2xl p-6 mx-4 mb-0 md:mb-0" onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4 md:hidden" />
        <p className="text-2xl text-center mb-2">🔐</p>
        <h3 className="text-base font-bold text-[#1A2F4B] text-center mb-1">로그인이 필요해요</h3>
        <p className="text-sm text-[#64748B] text-center mb-6">{message}</p>
        <button onClick={() => router.push('/auth')}
          className="w-full bg-[#0EA5A0] text-white rounded-xl py-3 text-sm font-semibold mb-2 hover:bg-[#0D7A76]">
          로그인 / 회원가입
        </button>
        <button onClick={onClose} className="w-full text-[#64748B] text-sm py-2">나중에</button>
      </div>
    </div>
  );
}
