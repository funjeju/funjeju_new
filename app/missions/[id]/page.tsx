'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, setDoc, updateDoc, Timestamp, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Mission, MissionProgress } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import GPSVerifyButton from '@/components/mission/GPSVerifyButton';
import LoginPrompt from '@/components/ui/LoginPrompt';
import { motion, AnimatePresence } from 'framer-motion';

export default function MissionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [mission, setMission] = useState<Mission | null>(null);
  const [progress, setProgress] = useState<MissionProgress | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    getDoc(doc(db, 'missions', id)).then(snap => {
      if (snap.exists()) setMission({ id: snap.id, ...snap.data() } as Mission);
    });
    if (user) {
      getDoc(doc(db, 'mission_progress', `${user.uid}_${id}`)).then(snap => {
        if (snap.exists()) setProgress(snap.data() as MissionProgress);
      });
    }
  }, [id, user]);

  async function verifySpot(order: number) {
    if (!user) { setShowLogin(true); return; }
    if (!mission || verifying) return;
    setVerifying(true);

    const progressId = `${user.uid}_${id}`;
    const completedSpots = [...(progress?.completedSpots ?? []), order];
    const isCompleted = completedSpots.length >= mission.spots.length;

    const newProgress: MissionProgress = {
      id: progressId, uid: user.uid, missionId: id,
      status: isCompleted ? 'completed' : 'in_progress',
      completedSpots, startedAt: progress?.startedAt ?? Timestamp.now(),
      ...(isCompleted ? { completedAt: Timestamp.now() } : {}),
    };

    await setDoc(doc(db, 'mission_progress', progressId), newProgress);
    if (isCompleted) {
      await updateDoc(doc(db, 'missions', id), { participantCount: increment(1) });
      await updateDoc(doc(db, 'users', user.uid), {
        missionCompleteCount: increment(1),
        points: increment(mission.reward.points ?? 0),
      });
      setCompleted(true);
    }
    setProgress(newProgress);
    setVerifying(false);
  }

  if (!mission) return (
    <div className="max-w-lg mx-auto px-4 py-8 animate-pulse space-y-4">
      <div className="h-6 bg-gray-200 rounded w-2/3" />
      {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 bg-gray-200 rounded-xl" />)}
    </div>
  );

  const completedSpots = new Set(progress?.completedSpots ?? []);

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <button onClick={() => router.back()} className="text-[#64748B] mb-4 flex items-center gap-1 text-sm">‹ 뒤로</button>

      <h1 className="text-xl font-bold text-[#1A2F4B] mb-1">{mission.title}</h1>
      <div className="flex gap-2 mb-4">
        <span className="text-xs text-[#64748B]">{'★'.repeat(mission.difficulty)} · ⏱ {mission.estimatedMinutes}분</span>
        {mission.tags?.map(t => <span key={t} className="text-xs bg-[#E0F7F6] text-[#0EA5A0] px-2 py-0.5 rounded-full">{t}</span>)}
      </div>

      <p className="text-sm text-[#64748B] mb-6">{mission.description}</p>

      {/* 스팟 목록 */}
      <h2 className="font-semibold text-[#1A2F4B] mb-3">미션 스팟</h2>
      <div className="space-y-3 mb-6">
        {mission.spots.map((spot, i) => {
          const done = completedSpots.has(spot.order);
          const current = !done && i === completedSpots.size;
          return (
            <div key={spot.order} className={`rounded-xl border p-4 ${done ? 'border-[#22C55E] bg-green-50' : current ? 'border-[#0EA5A0] bg-[#E0F7F6]' : 'border-[#E2E8F0] bg-white'}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{done ? '✅' : current ? '🔵' : '🔒'}</span>
                <p className="font-semibold text-[#1A2F4B] text-sm">{spot.order}. {spot.name}</p>
                {done && <span className="ml-auto text-xs text-[#22C55E] font-medium">인증됨</span>}
              </div>
              <p className="text-xs text-[#64748B] mb-3">{spot.description}</p>
              {spot.hint && <p className="text-xs text-[#F59E0B] mb-3">💡 힌트: {spot.hint}</p>}
              {current && !done && (
                <GPSVerifyButton
                  targetLat={spot.lat} targetLng={spot.lng}
                  radiusMeters={spot.radiusMeters}
                  onVerify={() => verifySpot(spot.order)}
                  disabled={verifying}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* 보상 */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
        <h2 className="font-semibold text-[#1A2F4B] mb-2">🎁 보상</h2>
        <p className="text-sm text-[#64748B]">{mission.reward.description}</p>
        {mission.reward.points && <p className="text-[#F59E0B] font-bold mt-1">+{mission.reward.points} 포인트</p>}
      </div>

      {/* 완료 모달 */}
      <AnimatePresence>
        {completed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}
              className="bg-white rounded-3xl p-8 text-center mx-4 max-w-sm w-full">
              <p className="text-5xl mb-4">🎉</p>
              <h2 className="text-xl font-bold text-[#1A2F4B] mb-1">미션 완료!</h2>
              <p className="text-[#64748B] text-sm mb-4">{mission.title}</p>
              <div className="bg-[#FFF8E7] rounded-xl p-4 mb-4">
                <p className="font-semibold text-[#F59E0B]">{mission.reward.description}</p>
                {mission.reward.points && <p className="text-lg font-bold text-[#F59E0B]">+{mission.reward.points} 포인트 획득!</p>}
              </div>
              <button onClick={() => { setCompleted(false); router.push('/missions'); }}
                className="w-full py-3 bg-[#0EA5A0] text-white rounded-xl font-semibold">다른 미션 보기</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {showLogin && <LoginPrompt message="미션 진행을 저장하려면 로그인하세요" onClose={() => setShowLogin(false)} />}
    </div>
  );
}
