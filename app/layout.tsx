import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import Header from '@/components/layout/Header';
import MobileTabBar from '@/components/layout/MobileTabBar';
import FloatingChatbot from '@/components/layout/FloatingChatbot';
import Providers from '@/components/Providers';

const geist = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'STAYLINK — 제주 스마트 관광 플랫폼',
  description: '제주 실시간 CCTV + AI 날씨 브리핑 + 오름 스탬프 + GPS 미션을 하나로',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${geist.variable} h-full`}>
      <body className="min-h-full bg-[#F8FAFC] text-[#1A2F4B] antialiased">
        <Providers>
          <Header />
          <main className="md:pt-16 pb-16 md:pb-0 min-h-screen">
            {children}
          </main>
          <MobileTabBar />
          <FloatingChatbot />
        </Providers>
      </body>
    </html>
  );
}
