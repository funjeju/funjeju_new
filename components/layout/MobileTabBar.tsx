'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useChatStore } from '@/store/chatStore';

const tabs = [
  { href: '/', label: '홈', icon: '🏠' },
  { href: '/live-feed', label: 'Live', icon: '🔴' },
  { href: '/map', label: 'CCTV', icon: '📹' },
  { href: '/oreums', label: '오름', icon: '🌿' },
  { href: '/geocaching', label: '보물', icon: '📦' },
  { href: '/mypage', label: '마이', icon: '👤' },
];

export default function MobileTabBar() {
  const pathname = usePathname();
  const { setOpen } = useChatStore();

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-16 bg-white border-t border-[#E2E8F0] flex items-center safe-area-pb">
      {tabs.map(tab => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-colors ${
            isActive(tab.href) ? 'text-[#0EA5A0]' : 'text-[#64748B]'
          }`}
        >
          <span className="text-xl leading-none">{tab.icon}</span>
          <span className={`text-[10px] font-medium ${isActive(tab.href) ? 'text-[#0EA5A0]' : 'text-[#64748B]'}`}>
            {tab.label}
          </span>
        </Link>
      ))}
    </nav>
  );
}
