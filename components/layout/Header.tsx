'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();

  const navItems = [
    { href: '/map', label: '지도·CCTV' },
    { href: '/weather', label: '날씨캐스터' },
    { href: '/oreums', label: '오름 도감' },
    { href: '/missions', label: '미션' },
    { href: '/jeju-tube', label: '제주 소식' },
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
      </nav>

      <Link
        href="/auth"
        className="px-4 py-2 rounded-lg bg-[#0EA5A0] text-white text-sm font-medium hover:bg-[#0D7A76] transition-colors"
      >
        로그인
      </Link>
    </header>
  );
}
