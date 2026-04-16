'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? 'admin@funjeju.com').split(',');

const cards = [
  { href: '/admin/cctv', icon: '📷', label: 'CCTV 관리', desc: '스트림 추가·수정·삭제' },
  { href: '/admin/oreums', icon: '🌿', label: '오름 관리', desc: '발행·GPS 설정·사진' },
  { href: '/admin/missions', icon: '🎯', label: '미션 관리', desc: '미션 생성·보상 설정' },
  { href: '/admin/live-feeds', icon: '📸', label: '라이브 피드', desc: '소상공인 사진 승인·관리' },
];

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || !ADMIN_EMAILS.includes(user.email ?? ''))) {
      router.replace('/');
    }
  }, [user, loading, router]);

  if (loading) return <div className="flex items-center justify-center min-h-screen"><p>확인 중...</p></div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-[#1A2F4B] mb-1">관리자 대시보드</h1>
      <p className="text-sm text-[#64748B] mb-8">{user?.email}</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {cards.map(c => (
          <Link key={c.href} href={c.href}
            className="bg-white border border-[#E2E8F0] rounded-2xl p-6 hover:shadow-md transition-shadow">
            <p className="text-3xl mb-3">{c.icon}</p>
            <p className="font-semibold text-[#1A2F4B]">{c.label}</p>
            <p className="text-xs text-[#64748B] mt-1">{c.desc}</p>
          </Link>
        ))}
      </div>

      {/* 데이터 Import */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6">
        <h2 className="font-semibold text-[#1A2F4B] mb-4">데이터 Import</h2>
        <div className="space-y-3">
          <ImportButton label="CCTV 44개 Seed (실제 스트림 데이터)" endpoint="/api/seed" method="POST" query="?force=1" />
          <ImportButton label="POI 5,981개 Import (200개씩)" endpoint="/api/import-pois" total={5981} batchSize={200} />
          <ImportButton label="오름 데이터 Import" endpoint="/api/import-oreums" />
        </div>
      </div>
    </div>
  );
}

function ImportButton({ label, endpoint, total, batchSize, method = 'POST', query = '' }: { label: string; endpoint: string; total?: number; batchSize?: number; method?: string; query?: string }) {
  async function run() {
    if (!total || !batchSize) {
      const r = await fetch(endpoint + query, { method });
      alert(JSON.stringify(await r.json(), null, 2));
      return;
    }
    let offset = 0;
    while (offset < total) {
      const r = await fetch(`${endpoint}?offset=${offset}&limit=${batchSize}`, { method: 'POST' });
      const d = await r.json();
      console.log(d);
      if (!d.next) break;
      offset = d.next;
    }
    alert('Import 완료!');
  }
  return (
    <button onClick={run}
      className="w-full text-left px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm hover:bg-[#E0F7F6] transition-colors">
      {label}
    </button>
  );
}
