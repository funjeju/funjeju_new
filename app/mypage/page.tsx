'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { signOutUser } from '@/lib/firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import Image from 'next/image';

interface UserProfile {
  stampCount?: number;
  missionCompleteCount?: number;
  points?: number;
  type?: 'user' | 'partner';
}

interface PartnerProfile {
  businessName: string;
  ctaType: 'visit' | 'call' | 'menu' | 'reserve';
  ctaLabel: string;
  ctaUrl: string;
  ctaPhone: string;
}

const CTA_OPTIONS = [
  { value: 'visit', label: '📍 지금 방문하기' },
  { value: 'call',  label: '📞 전화하기' },
  { value: 'menu',  label: '🍽 메뉴 보기' },
  { value: 'reserve', label: '📅 예약하기' },
];

const DEFAULT_LABEL: Record<string, string> = {
  visit: '지금 방문하기',
  call: '전화하기',
  menu: '메뉴 보기',
  reserve: '예약하기',
};

export default function MyPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [partner, setPartner] = useState<PartnerProfile>({
    businessName: '', ctaType: 'visit', ctaLabel: '지금 방문하기', ctaUrl: '', ctaPhone: '',
  });
  const [isPartner, setIsPartner] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push('/auth');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, 'users', user.uid)).then(snap => {
      if (snap.exists()) {
        const data = snap.data() as UserProfile & { partnerProfile?: PartnerProfile };
        setProfile(data);
        setIsPartner(data.type === 'partner');
        if (data.partnerProfile) setPartner(data.partnerProfile);
      }
    });
  }, [user]);

  async function savePartnerProfile() {
    if (!user) return;
    setSaving(true);
    await setDoc(doc(db, 'users', user.uid), {
      type: 'partner',
      partnerProfile: partner,
    }, { merge: true });
    setIsPartner(true);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleSignOut() {
    await signOutUser();
    router.push('/');
  }

  if (loading || !user) return <div className="flex items-center justify-center min-h-screen"><p>로딩 중...</p></div>;

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-4">
      {/* 프로필 */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 flex items-center gap-4">
        {user.photoURL ? (
          <Image src={user.photoURL} alt="프로필" width={56} height={56} className="rounded-full" />
        ) : (
          <div className="w-14 h-14 rounded-full bg-[#E0F7F6] flex items-center justify-center text-2xl">👤</div>
        )}
        <div>
          <p className="font-bold text-[#1A2F4B]">{user.displayName || '제주 여행자'}</p>
          <p className="text-sm text-[#64748B]">{user.email}</p>
          {isPartner && (
            <span className="inline-block mt-1 text-[10px] bg-[#0EA5A0] text-white px-2 py-0.5 rounded-full">소상공인 파트너</span>
          )}
        </div>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-3 gap-3">
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
      <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden">
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

      {/* ── 소상공인 파트너 프로필 ── */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E2E8F0]">
          <p className="font-semibold text-[#1A2F4B]">📸 소상공인 파트너 정보</p>
          <p className="text-xs text-[#64748B] mt-0.5">한 번 저장하면 Live 피드 올릴 때 자동으로 적용됩니다</p>
        </div>
        <div className="p-5 space-y-4">
          {/* 업체명 */}
          <div>
            <label className="text-sm font-medium text-[#1A2F4B] block mb-1">업체명 *</label>
            <input
              value={partner.businessName}
              onChange={e => setPartner(p => ({ ...p, businessName: e.target.value }))}
              placeholder="예: 협재 카페 바다향"
              className="w-full border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#0EA5A0]"
            />
          </div>

          {/* CTA 타입 */}
          <div>
            <label className="text-sm font-medium text-[#1A2F4B] block mb-2">CTA 버튼 유형</label>
            <div className="grid grid-cols-2 gap-2">
              {CTA_OPTIONS.map(opt => (
                <button key={opt.value}
                  onClick={() => setPartner(p => ({ ...p, ctaType: opt.value as PartnerProfile['ctaType'], ctaLabel: DEFAULT_LABEL[opt.value] }))}
                  className={`py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                    partner.ctaType === opt.value
                      ? 'bg-[#0EA5A0] text-white border-[#0EA5A0]'
                      : 'bg-white text-[#64748B] border-[#E2E8F0]'
                  }`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* CTA 문구 */}
          <div>
            <label className="text-sm font-medium text-[#1A2F4B] block mb-1">버튼 문구</label>
            <input
              value={partner.ctaLabel}
              onChange={e => setPartner(p => ({ ...p, ctaLabel: e.target.value }))}
              placeholder="지금 방문하기"
              className="w-full border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#0EA5A0]"
            />
          </div>

          {/* 전화/URL */}
          {partner.ctaType === 'call' ? (
            <div>
              <label className="text-sm font-medium text-[#1A2F4B] block mb-1">전화번호</label>
              <input
                value={partner.ctaPhone}
                onChange={e => setPartner(p => ({ ...p, ctaPhone: e.target.value }))}
                placeholder="064-xxx-xxxx"
                className="w-full border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#0EA5A0]"
              />
            </div>
          ) : (
            <div>
              <label className="text-sm font-medium text-[#1A2F4B] block mb-1">연결 URL (선택)</label>
              <input
                value={partner.ctaUrl}
                onChange={e => setPartner(p => ({ ...p, ctaUrl: e.target.value }))}
                placeholder="https://..."
                className="w-full border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#0EA5A0]"
              />
            </div>
          )}

          <button
            onClick={savePartnerProfile}
            disabled={!partner.businessName || saving}
            className="w-full py-3 bg-[#0EA5A0] text-white rounded-xl font-semibold text-sm disabled:opacity-40"
          >
            {saving ? '저장 중...' : saved ? '✅ 저장됨!' : '파트너 정보 저장'}
          </button>
        </div>
      </div>

      <button onClick={handleSignOut}
        className="w-full py-3 border border-[#E2E8F0] rounded-xl text-sm text-[#64748B] hover:bg-[#F8FAFC]">
        로그아웃
      </button>
    </div>
  );
}
