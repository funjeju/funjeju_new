'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { signOutUser } from '@/lib/firebase/auth';
import { useChatStore } from '@/store/chatStore';
import type { ChatTab } from '@/store/chatStore';
import Image from 'next/image';

export default function Header() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { setOpen } = useChatStore();

  const navItems = [
    { href: '/live-feed', label: '🔴 Live 피드' },
    { href: '/map', label: '지도·CCTV' },
    { href: '/oreums', label: '오름 도감' },
    { href: '/missions', label: '미션' },
    { href: '/geocaching', label: '📦 지오캐싱' },
    { href: '/jeju-tube', label: '제주 소식' },
  ];

  const aiItems: { label: string; tab: ChatTab }[] = [
    { label: '🤖 도슨트 AI', tab: 'docent' },
    { label: '🌤 날씨캐스터', tab: 'weather' },
  ];

  return (
    <header className="hidden md:flex fixed top-0 left-0 right-0 z-50 h-16 bg-white border-b border-[#E2E8F0] items-center px-6 shadow-sm">
      <Link href="/" className="flex items-center gap-2 mr-8">
        <span className="text-xl font-bold text-[#0EA5A0]">STAYLINK</span>
        <span className="text-xs text-[#64748B]">제주 스마트 관광</span>
      </Link>

      <nav className="flex items-center gap-1 flex-1">
        {navItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              pathname.startsWith(item.href)
                ? 'bg-[#E0F7F6] text-[#0EA5A0]'
                : 'text-[#1A2F4B] hover:bg-gray-100'
            }`}
          >
            {item.label}
          </Link>
        ))}

        {/* AI 챗봇 드롭다운 */}
        <div className="relative group">
          <button className="px-4 py-2 rounded-lg text-sm font-medium text-[#1A2F4B] hover:bg-gray-100 flex items-center gap-1">
            🤖 AI 챗봇
            <span className="text-[10px] text-[#94A3B8]">▾</span>
          </button>
          <div className="absolute top-full left-0 mt-1 w-40 bg-white border border-[#E2E8F0] rounded-xl shadow-lg overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
            {aiItems.map(a => (
              <button key={a.tab} onClick={() => setOpen(true, a.tab)}
                className="w-full text-left px-4 py-2.5 text-sm text-[#1A2F4B] hover:bg-[#E0F7F6] hover:text-[#0EA5A0] transition-colors">
                {a.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {user ? (
        <div className="flex items-center gap-2">
          {user.photoURL && (
            <Image src={user.photoURL} alt="프로필" width={28} height={28} className="rounded-full" />
          )}
          <Link href="/mypage" className="text-sm font-medium text-[#1A2F4B] hover:text-[#0EA5A0]">
            {user.displayName?.split(' ')[0] ?? '마이'}
          </Link>
          <button onClick={signOutUser} className="px-3 py-1.5 rounded-lg border border-[#E2E8F0] text-xs text-[#64748B] hover:bg-gray-50">
            로그아웃
          </button>
        </div>
      ) : (
        <Link href="/auth" className="px-4 py-2 rounded-lg bg-[#0EA5A0] text-white text-sm font-medium hover:bg-[#0D7A76] transition-colors">
          로그인
        </Link>
      )}
    </header>
  );
}
