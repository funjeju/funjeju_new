'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { signOutUser } from '@/lib/firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { User } from '@/types';
import Image from 'next/image';

export default function MyPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<User | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push('/auth');
    if (user) {
      getDoc(doc(db, 'users', user.uid)).then(snap => {
        if (snap.exists()) setProfile(snap.data() as User);
      });
    }
  }, [user, loading, router]);

  async function handleSignOut() {
    await signOutUser();
    router.push('/');
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen"><p>로딩 중...</p></div>;
  if (!user) return null;

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      {/* 프로필 */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 mb-4 flex items-center gap-4">
        {user.photoURL ? (
          <Image src={user.photoURL} alt="프로필" width={56} height={56} className="rounded-full" />
        ) : (
          <div className="w-14 h-14 rounded-full bg-[#E0F7F6] flex items-center justify-center text-2xl">👤</div>
        )}
        <div>
          <p className="font-bold text-[#1A2F4B]">{user.displayName || '제주 여행자'}</p>
          <p className="text-sm text-[#64748B]">{user.email}</p>
        </div>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: '오름 스탬프', value: profile?.stampCount ?? 0, icon: '🌿' },
          { label: '미션 완료', value: profile?.missionCompleteCount ?? 0, icon: '🎯' },
          { label: '포인트', value: profile?.points ?? 0, icon: '⭐' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-[#E2E8F0] rounded-xl p-4 text-center">
            <p className="text-2xl mb-1">{s.icon}</p>
            <p className="text-xl font-bold text-[#1A2F4B]">{s.value}</p>
            <p className="text-xs text-[#64748B]">{s.label}</p>
          </div>
        ))}
      </div>

      {/* 메뉴 */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden mb-4">
        {[
          { label: '찜한 오름', icon: '🌿', href: '/oreums' },
          { label: '내 미션 현황', icon: '🎯', href: '/missions' },
          { label: '쿠폰함', icon: '🎁', href: '#' },
        ].map(m => (
          <button key={m.label} onClick={() => router.push(m.href)}
            className="w-full flex items-center gap-3 px-5 py-4 border-b border-[#E2E8F0] last:border-0 hover:bg-[#F8FAFC] text-left">
            <span className="text-lg">{m.icon}</span>
            <span className="text-sm font-medium text-[#1A2F4B]">{m.label}</span>
            <span className="ml-auto text-[#64748B]">›</span>
          </button>
        ))}
      </div>

      <button onClick={handleSignOut}
        className="w-full py-3 border border-[#E2E8F0] rounded-xl text-sm text-[#64748B] hover:bg-[#F8FAFC]">
        로그아웃
      </button>
    </div>
  );
}
