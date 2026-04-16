'use client';

import { useState, useRef, useEffect, ChangeEvent } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import Image from 'next/image';
import Link from 'next/link';
import LoginPrompt from '@/components/ui/LoginPrompt';

interface PartnerProfile {
  businessName: string;
  ctaType: string;
  ctaLabel: string;
  ctaUrl: string;
  ctaPhone: string;
}

interface UploadResult {
  preview: string;
  locationName: string;
  freshScore: number;
  freshLabel: string;
  photoUrl: string;
  id: string;
}

export default function PartnerUploadPage() {
  const { user } = useAuth();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<PartnerProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const [file, setFile] = useState<File | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [done, setDone] = useState(false);

  // 파트너 프로필 자동 로드
  useEffect(() => {
    if (!user) { setProfileLoading(false); return; }
    getDoc(doc(db, 'users', user.uid)).then(snap => {
      const data = snap.data();
      if (data?.partnerProfile) setProfile(data.partnerProfile as PartnerProfile);
    }).finally(() => setProfileLoading(false));
  }, [user]);

  function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreviewSrc(URL.createObjectURL(f));
    setResult(null);
    setError(null);
  }

  async function handleUpload() {
    if (!user) { setShowLogin(true); return; }
    if (!file || !profile) return;

    setUploading(true);
    setError(null);

    const form = new FormData();
    form.append('photo', file);
    form.append('partnerId', user.uid);
    form.append('businessName', profile.businessName);
    form.append('ctaType', profile.ctaType);
    form.append('ctaLabel', profile.ctaLabel);
    if (profile.ctaType === 'call') form.append('ctaPhone', profile.ctaPhone);
    else if (profile.ctaUrl) form.append('ctaUrl', profile.ctaUrl);

    const res = await fetch('/api/live-feed/upload', { method: 'POST', body: form });
    const data = await res.json();

    if (!res.ok) {
      setError(data.message ?? '업로드 실패');
      setUploading(false);
      return;
    }

    setResult(data);
    setUploading(false);
  }

  if (done) return (
    <div className="max-w-lg mx-auto px-4 py-12 text-center">
      <p className="text-5xl mb-4">🎉</p>
      <h2 className="text-xl font-bold text-[#1A2F4B] mb-2">Live 피드 등록 완료!</h2>
      <p className="text-[#64748B] text-sm mb-2">메인 화면에 실시간으로 노출됩니다.</p>
      {result && (
        <div className="bg-[#E0F7F6] rounded-xl p-3 mb-6 text-sm text-[#0EA5A0]">
          신선도 점수: <strong>{result.freshScore}점</strong> · {result.freshLabel}
        </div>
      )}
      <div className="space-y-3">
        <button onClick={() => { setDone(false); setFile(null); setPreviewSrc(null); setResult(null); }}
          className="w-full py-3 border border-[#0EA5A0] text-[#0EA5A0] rounded-xl font-semibold">
          사진 한 장 더 올리기
        </button>
        <button onClick={() => router.push('/')}
          className="w-full py-3 bg-[#0EA5A0] text-white rounded-xl font-semibold">
          메인에서 확인하기
        </button>
      </div>
    </div>
  );

  // 프로필 미등록 상태
  if (!profileLoading && user && !profile) return (
    <div className="max-w-lg mx-auto px-4 py-12 text-center">
      <p className="text-5xl mb-4">📋</p>
      <h2 className="text-xl font-bold text-[#1A2F4B] mb-2">파트너 정보를 먼저 등록해주세요</h2>
      <p className="text-sm text-[#64748B] mb-6">
        마이페이지에서 업체명과 CTA 버튼을 한 번만 설정하면<br />
        이후 사진만 찍어서 바로 올릴 수 있어요
      </p>
      <Link href="/mypage"
        className="inline-block px-8 py-3 bg-[#0EA5A0] text-white rounded-xl font-semibold">
        마이페이지에서 설정하기 →
      </Link>
    </div>
  );

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24">
      <h1 className="text-xl font-bold text-[#1A2F4B] mb-1">📸 오늘의 현장 사진 올리기</h1>
      <p className="text-sm text-[#64748B] mb-5">GPS 정보가 포함된 사진만 Live 피드에 자동 등록됩니다</p>

      {/* 파트너 프로필 요약 */}
      {profile && (
        <div className="flex items-center justify-between bg-[#F0FDF9] border border-[#0EA5A0]/20 rounded-xl px-4 py-3 mb-5">
          <div>
            <p className="text-sm font-semibold text-[#1A2F4B]">{profile.businessName}</p>
            <p className="text-xs text-[#64748B] mt-0.5">CTA: {profile.ctaLabel}</p>
          </div>
          <Link href="/mypage" className="text-xs text-[#0EA5A0] hover:underline">수정 →</Link>
        </div>
      )}

      {/* 사진 선택 */}
      <div
        onClick={() => fileRef.current?.click()}
        className="relative w-full aspect-[4/3] bg-gray-100 rounded-2xl overflow-hidden cursor-pointer border-2 border-dashed border-[#E2E8F0] hover:border-[#0EA5A0] transition-colors mb-4"
      >
        {previewSrc ? (
          <Image src={previewSrc} alt="preview" fill className="object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-[#94A3B8] gap-2">
            <span className="text-5xl">📷</span>
            <span className="text-sm font-medium">사진 선택 또는 카메라 촬영</span>
            <span className="text-xs">스마트폰으로 직접 찍은 사진 권장</span>
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/jpeg,image/jpg,image/png" capture="environment" className="hidden" onChange={handleFile} />
      </div>

      {/* 에러 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
          <p className="text-sm text-red-600 font-medium mb-1">
            {error.includes('GPS') ? '📍 GPS 정보 없음' : '⚠️ 업로드 실패'}
          </p>
          <p className="text-xs text-red-500">{error}</p>
          {error.includes('GPS') && (
            <p className="text-xs text-red-400 mt-1">스마트폰 카메라 앱 → 설정 → 위치 정보 허용 후 재촬영하세요</p>
          )}
        </div>
      )}

      {/* AI 분석 결과 미리보기 */}
      {result && profile && (
        <div className="bg-[#F0FDF9] border border-[#0EA5A0]/30 rounded-2xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold text-[#0EA5A0]">✨ AI 콘텐츠 생성 완료</span>
            <span className="ml-auto text-xs bg-[#0EA5A0] text-white px-2 py-0.5 rounded-full">
              신선도 {result.freshScore}점
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#64748B] mb-3">
            <span>📍 {result.locationName}</span>
            <span>·</span>
            <span>🕐 {result.freshLabel}</span>
          </div>
          <div className="bg-white rounded-xl overflow-hidden border border-[#E2E8F0]">
            <div className="relative aspect-[4/3]">
              <Image src={result.photoUrl} alt="preview" fill className="object-cover" unoptimized />
              <div className="absolute top-2 left-2 flex items-center gap-1 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                {result.freshLabel}
              </div>
              <span className="absolute top-2 right-2 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full">
                📍 {result.locationName}
              </span>
            </div>
            <div className="p-3">
              <p className="text-xs text-[#64748B] line-clamp-3 mb-2">{result.preview}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#1A2F4B]">{profile.businessName}</span>
                <button className="text-xs bg-[#0EA5A0] text-white px-3 py-1 rounded-lg">{profile.ctaLabel}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 버튼 */}
      {!result ? (
        <button onClick={handleUpload}
          disabled={!file || !profile || uploading}
          className="w-full py-4 bg-[#0EA5A0] text-white rounded-xl font-semibold text-base disabled:opacity-40 disabled:cursor-not-allowed">
          {uploading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              AI 분석 중...
            </span>
          ) : '업로드 & AI 분석'}
        </button>
      ) : (
        <div className="flex gap-3">
          <button onClick={() => { setResult(null); setFile(null); setPreviewSrc(null); }}
            className="flex-1 py-4 border border-[#E2E8F0] text-[#64748B] rounded-xl font-semibold">
            수정하기
          </button>
          <button onClick={() => setDone(true)}
            className="flex-1 py-4 bg-[#0EA5A0] text-white rounded-xl font-semibold">
            Live 피드에 올리기
          </button>
        </div>
      )}

      {showLogin && <LoginPrompt message="피드 업로드를 위해 로그인이 필요합니다" onClose={() => setShowLogin(false)} />}
    </div>
  );
}
