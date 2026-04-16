'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, setDoc, Timestamp, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Oreum, OreumStamp } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import GPSVerifyButton from '@/components/mission/GPSVerifyButton';
import StampAnimation from '@/components/oreum/StampAnimation';
import LoginPrompt from '@/components/ui/LoginPrompt';
import Image from 'next/image';

export default function OreumDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [oreum, setOreum] = useState<Oreum | null>(null);
  const [isStamped, setIsStamped] = useState(false);
  const [showStamp, setShowStamp] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    getDoc(doc(db, 'oreums', id)).then(snap => {
      if (snap.exists()) setOreum({ id: snap.id, ...snap.data() } as Oreum);
    });
    if (user) {
      getDoc(doc(db, 'oreum_stamps', `${user.uid}_${id}`)).then(snap => setIsStamped(snap.exists()));
    }
  }, [id, user]);

  async function handleVerify() {
    if (!user) { setShowLogin(true); return; }
    if (!oreum || verifying) return;
    setVerifying(true);
    const stampId = `${user.uid}_${id}`;
    await setDoc(doc(db, 'oreum_stamps', stampId), {
      id: stampId, uid: user.uid, oreumId: id, oreumName: oreum.name,
      stampedAt: Timestamp.now(), lat: oreum.stampLat, lng: oreum.stampLng,
    });
    await updateDoc(doc(db, 'oreums', id), { stampCount: increment(1) });
    await updateDoc(doc(db, 'users', user.uid), { stampCount: increment(1) });
    setIsStamped(true);
    setShowStamp(true);
    setVerifying(false);
  }

  if (!oreum) return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <div className="animate-pulse space-y-4">
        <div className="h-64 bg-gray-200 rounded-2xl" />
        <div className="h-6 bg-gray-200 rounded w-1/2" />
        <div className="h-4 bg-gray-200 rounded w-3/4" />
      </div>
    </div>
  );

  const allPhotos = [...(oreum.photos?.main ?? []), ...(oreum.photos?.summit ?? [])];

  return (
    <div className="max-w-lg mx-auto">
      {/* 대표 사진 헤더 */}
      <div className="relative h-64 bg-[#4CAF50]/10">
        <button onClick={() => router.back()} className="absolute top-4 left-4 z-10 bg-black/30 text-white rounded-full w-8 h-8 flex items-center justify-center">‹</button>
        {allPhotos[0] ? (
          <Image src={allPhotos[0]} alt={oreum.name} fill className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">🌿</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-4 left-4">
          <h1 className="text-2xl font-bold text-white">{oreum.name}</h1>
          <p className="text-white/80 text-sm">{oreum.region}</p>
        </div>
      </div>

      <div className="px-4 py-5 space-y-5">
        {/* 기본 정보 뱃지 */}
        <div className="flex flex-wrap gap-2">
          <span className="text-xs bg-[#E0F7F6] text-[#0EA5A0] px-3 py-1 rounded-full">{'★'.repeat(oreum.difficulty)} 난이도</span>
          {oreum.altitude > 0 && <span className="text-xs bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0] px-3 py-1 rounded-full">⛰ {oreum.altitude}m</span>}
          {oreum.tags?.slice(0, 3).map(t => <span key={t} className="text-xs bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0] px-3 py-1 rounded-full">{t}</span>)}
        </div>

        {/* 소개 */}
        {oreum.description && (
          <div>
            <h2 className="font-semibold text-[#1A2F4B] mb-2">오름 소개</h2>
            <p className="text-sm text-[#64748B] leading-relaxed">{oreum.description}</p>
          </div>
        )}

        {/* 기본 정보 */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 space-y-2">
          <h2 className="font-semibold text-[#1A2F4B] mb-3">기본 정보</h2>
          {[
            { icon: '📍', label: oreum.address },
            { icon: '🚗', label: oreum.parking || '주차 정보 없음' },
            { icon: '🥾', label: oreum.trailInfo || '탐방로 정보 없음' },
            { icon: '🕐', label: oreum.openTime || '일출~일몰' },
          ].map(r => (
            <div key={r.icon} className="flex gap-2 text-sm">
              <span>{r.icon}</span>
              <span className="text-[#64748B]">{r.label}</span>
            </div>
          ))}
        </div>

        {/* 사진 탭 */}
        {allPhotos.length > 0 && (
          <div>
            <h2 className="font-semibold text-[#1A2F4B] mb-2">사진</h2>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {allPhotos.slice(0, 6).map((url, i) => (
                <div key={i} className="flex-shrink-0 relative w-24 h-24 rounded-lg overflow-hidden">
                  <Image src={url} alt="" fill className="object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 스탬프 인증 */}
        <div className="pb-6">
          {isStamped ? (
            <div className="w-full py-4 bg-[#E0F7F6] text-[#0EA5A0] rounded-xl text-center font-semibold">
              ✅ 스탬프 인증 완료
            </div>
          ) : (
            <GPSVerifyButton
              targetLat={oreum.stampLat || oreum.lat}
              targetLng={oreum.stampLng || oreum.lng}
              onVerify={handleVerify}
              disabled={verifying}
            />
          )}
        </div>
      </div>

      {showStamp && <StampAnimation oreumName={oreum.name} onClose={() => setShowStamp(false)} />}
      {showLogin && <LoginPrompt message="스탬프 기록을 위해 로그인이 필요합니다" onClose={() => setShowLogin(false)} />}
    </div>
  );
}
