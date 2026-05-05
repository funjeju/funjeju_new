'use client';

import { useState, useRef, useEffect, ChangeEvent } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import Link from 'next/link';
import LoginPrompt from '@/components/ui/LoginPrompt';
import ExifReader from 'exifreader';

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

interface ExifInfo {
  lat: number;
  lng: number;
  shootAt: Date;
  freshScore: number;
  freshLabel: string;
}

type ExifError = 'no-gps' | 'too-old' | null;

function calcFreshScore(shootAt: Date): number {
  const diffHours = (Date.now() - shootAt.getTime()) / 3_600_000;
  if (diffHours < 1) return 100;
  if (diffHours < 3) return 80;
  if (diffHours < 6) return 60;
  if (diffHours < 12) return 40;
  return 0;
}

function calcFreshLabel(shootAt: Date): string {
  const diffMin = Math.floor((Date.now() - shootAt.getTime()) / 60_000);
  if (diffMin < 1) return '방금 전';
  if (diffMin < 60) return `${diffMin}분 전`;
  return `${Math.floor(diffMin / 60)}시간 전`;
}

export default function PartnerUploadPage() {
  const { user } = useAuth();
  const router = useRouter();
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<PartnerProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const [file, setFile] = useState<File | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [exifInfo, setExifInfo] = useState<ExifInfo | null>(null);
  const [exifError, setExifError] = useState<ExifError>(null);

  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!user) { setProfileLoading(false); return; }
    getDoc(doc(db, 'users', user.uid)).then(snap => {
      const data = snap.data();
      if (data?.partnerProfile) setProfile(data.partnerProfile as PartnerProfile);
    }).finally(() => setProfileLoading(false));
  }, [user]);

  useEffect(() => {
    return () => { if (previewSrc?.startsWith('blob:')) URL.revokeObjectURL(previewSrc); };
  }, [previewSrc]);

  async function handleFile(f: File) {
    if (previewSrc?.startsWith('blob:')) URL.revokeObjectURL(previewSrc);
    setFile(f);
    setPreviewSrc(URL.createObjectURL(f));
    setResult(null);
    setError(null);
    setExifInfo(null);
    setExifError(null);

    try {
      const buffer = await f.arrayBuffer();
      const tags = ExifReader.load(buffer);

      const latVal = tags['GPSLatitude']?.description;
      const lngVal = tags['GPSLongitude']?.description;

      if (latVal == null || lngVal == null) {
        setExifError('no-gps');
        return;
      }

      const latRefVal = tags['GPSLatitudeRef']?.value;
      const lngRefVal = tags['GPSLongitudeRef']?.value;
      const latRef = (Array.isArray(latRefVal) ? latRefVal[0] : latRefVal) ?? 'N';
      const lngRef = (Array.isArray(lngRefVal) ? lngRefVal[0] : lngRefVal) ?? 'E';
      const lat = latRef === 'S' ? -Number(latVal) : Number(latVal);
      const lng = lngRef === 'W' ? -Number(lngVal) : Number(lngVal);

      let shootAt = new Date();
      const dt = tags['DateTimeOriginal']?.description ?? tags['DateTime']?.description;
      if (dt) {
        const parsed = new Date(dt.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3'));
        if (!isNaN(parsed.getTime())) shootAt = parsed;
      }

      const freshScore = calcFreshScore(shootAt);
      if (freshScore === 0) {
        setExifError('too-old');
        return;
      }

      setExifInfo({ lat, lng, shootAt, freshScore, freshLabel: calcFreshLabel(shootAt) });
    } catch {
      setExifError('no-gps');
    }
  }

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
    e.target.value = '';
  }

  function resetAll() {
    setFile(null);
    setPreviewSrc(null);
    setExifInfo(null);
    setExifError(null);
    setResult(null);
    setError(null);
  }

  async function handleUpload() {
    if (!user) { setShowLogin(true); return; }
    if (!file || !profile || !exifInfo) return;

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
      <p className="text-[#64748B] text-sm mb-6">메인 화면에 실시간으로 노출됩니다.</p>
      {result && (
        <div className="bg-[#E0F7F6] rounded-xl p-3 mb-6 text-sm text-[#0EA5A0]">
          신선도 점수: <strong>{result.freshScore}점</strong> · {result.freshLabel}
        </div>
      )}
      <div className="space-y-3">
        <button
          onClick={() => { setDone(false); resetAll(); }}
          className="w-full py-3 border border-[#0EA5A0] text-[#0EA5A0] rounded-xl font-semibold"
        >
          사진 한 장 더 올리기
        </button>
        <button
          onClick={() => router.push('/')}
          className="w-full py-3 bg-[#0EA5A0] text-white rounded-xl font-semibold"
        >
          메인에서 확인하기
        </button>
      </div>
    </div>
  );

  if (!profileLoading && user && !profile) return (
    <div className="max-w-lg mx-auto px-4 py-12 text-center">
      <p className="text-5xl mb-4">📋</p>
      <h2 className="text-xl font-bold text-[#1A2F4B] mb-2">파트너 정보를 먼저 등록해주세요</h2>
      <p className="text-sm text-[#64748B] mb-6">
        마이페이지에서 업체명과 CTA 버튼을 한 번만 설정하면<br />
        이후 사진만 찍어서 바로 올릴 수 있어요
      </p>
      <Link href="/mypage" className="inline-block px-8 py-3 bg-[#0EA5A0] text-white rounded-xl font-semibold">
        마이페이지에서 설정하기 →
      </Link>
    </div>
  );

  const imgSrc = result?.photoUrl ?? previewSrc;
  const hasValidPhoto = !!previewSrc && !!exifInfo;
  const showCard = hasValidPhoto || !!result;

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-28">
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

      {/* 사진 선택 (미선택 상태) */}
      {!previewSrc && (
        <div className="rounded-2xl border-2 border-dashed border-[#E2E8F0] p-8 mb-4 text-center">
          <span className="text-6xl block mb-3">📷</span>
          <p className="text-sm font-medium text-[#64748B] mb-6">촬영하거나 갤러리에서 선택하세요</p>
          <div className="flex gap-3">
            <button
              onClick={() => cameraRef.current?.click()}
              className="flex-1 py-3 bg-[#0EA5A0] text-white rounded-xl font-semibold text-sm"
            >
              📷 지금 촬영
            </button>
            <button
              onClick={() => galleryRef.current?.click()}
              className="flex-1 py-3 border border-[#0EA5A0] text-[#0EA5A0] rounded-xl font-semibold text-sm"
            >
              🖼️ 갤러리 선택
            </button>
          </div>
        </div>
      )}

      {/* 미리보기 카드 — SNS 세로 비율(4:5) + EXIF 오버레이 */}
      {showCard && profile && imgSrc && (
        <div className="rounded-2xl overflow-hidden border border-[#E2E8F0] shadow-sm mb-4 bg-white">
          <div className="relative aspect-[4/5] bg-gray-100 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imgSrc}
              alt="preview"
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* 상단 그라데이션 오버레이 */}
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/55 to-transparent pointer-events-none" />

            {/* 신선도 배지 */}
            <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-md">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              {result?.freshLabel ?? exifInfo?.freshLabel ?? 'LIVE'}
            </div>

            {/* 위치 배지 */}
            <div className="absolute top-3 right-3">
              {result ? (
                <span className="bg-black/50 text-white text-[11px] px-2.5 py-1 rounded-full backdrop-blur-sm">
                  📍 {result.locationName}
                </span>
              ) : (
                <span className="bg-[#0EA5A0]/85 text-white text-[11px] px-2.5 py-1 rounded-full backdrop-blur-sm">
                  📍 GPS 확인 ✓
                </span>
              )}
            </div>

            {/* 하단 그라데이션 오버레이 */}
            <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/65 to-transparent pointer-events-none" />

            {/* 하단 텍스트 */}
            <div className="absolute bottom-3 left-3 right-3">
              {result ? (
                <p className="text-white text-xs leading-relaxed line-clamp-3">{result.preview}</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-white text-[11px] bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-sm">
                    🕐 {exifInfo?.freshLabel}
                  </span>
                  <span className="text-white text-[11px] bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-sm">
                    ✨ AI 분석 전
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* CTA 카드 */}
          <div className="px-4 py-3 flex items-center justify-between bg-white">
            <span className="text-sm font-semibold text-[#1A2F4B]">{profile.businessName}</span>
            <button className="text-xs bg-[#0EA5A0] text-white px-4 py-1.5 rounded-lg font-medium">
              {profile.ctaLabel}
            </button>
          </div>
        </div>
      )}

      {/* 사진 재선택 버튼 (사진 선택 후, 업로드 전) */}
      {previewSrc && !result && (
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => cameraRef.current?.click()}
            className="flex-1 py-2 border border-[#E2E8F0] text-[#64748B] rounded-xl text-xs font-medium"
          >
            📷 다시 촬영
          </button>
          <button
            onClick={() => galleryRef.current?.click()}
            className="flex-1 py-2 border border-[#E2E8F0] text-[#64748B] rounded-xl text-xs font-medium"
          >
            🖼️ 갤러리 재선택
          </button>
        </div>
      )}

      {/* 업로드 에러 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
          <p className="text-sm text-red-600 font-medium mb-1">⚠️ 업로드 실패</p>
          <p className="text-xs text-red-500">{error}</p>
        </div>
      )}

      {/* 메인 액션 버튼 */}
      {!result ? (
        <button
          onClick={handleUpload}
          disabled={!file || !profile || uploading || !exifInfo}
          className="w-full py-4 bg-[#0EA5A0] text-white rounded-xl font-semibold text-base disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              AI 분석 중...
            </span>
          ) : '업로드 & AI 분석'}
        </button>
      ) : (
        <div className="flex gap-3">
          <button
            onClick={async () => {
              if (result.id) {
                await fetch(`/api/live-feed?id=${result.id}`, { method: 'DELETE' }).catch(() => {});
              }
              resetAll();
            }}
            className="flex-1 py-4 border border-[#E2E8F0] text-[#64748B] rounded-xl font-semibold"
          >
            수정하기
          </button>
          <button
            onClick={() => setDone(true)}
            className="flex-1 py-4 bg-[#0EA5A0] text-white rounded-xl font-semibold"
          >
            Live 피드에 올리기
          </button>
        </div>
      )}

      {/* Hidden file inputs */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png"
        capture="environment"
        className="hidden"
        onChange={onFileChange}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png"
        className="hidden"
        onChange={onFileChange}
      />

      {/* GPS 없음 / 오래된 사진 — bottom sheet 모달 */}
      {exifError && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center"
          onClick={resetAll}
        >
          <div
            className="bg-white rounded-t-3xl p-6 w-full max-w-lg pb-safe"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-[#E2E8F0] rounded-full mx-auto mb-6" />
            <div className="text-center mb-5">
              <span className="text-5xl">{exifError === 'no-gps' ? '📍' : '⏰'}</span>
              <h3 className="text-lg font-bold mt-3 text-[#1A2F4B]">
                {exifError === 'no-gps' ? 'GPS 정보가 없어요' : '오래된 사진이에요'}
              </h3>
              <p className="text-sm text-[#64748B] mt-1.5 leading-relaxed">
                {exifError === 'no-gps'
                  ? 'Live 피드에는 GPS 정보가 포함된\n사진만 등록할 수 있어요'
                  : '12시간 이상 경과한 사진은\nLive 피드에 등록할 수 없어요'}
              </p>
            </div>

            {exifError === 'no-gps' && (
              <div className="bg-[#F8FAFC] rounded-2xl p-4 mb-5 text-left">
                <p className="text-xs font-semibold text-[#1A2F4B] mb-2">📱 GPS 허용하는 방법</p>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  <span className="font-medium">iPhone:</span> 설정 → 카메라 → 위치 서비스 허용<br />
                  <span className="font-medium">Android:</span> 카메라 앱 → 설정 → 위치 태그 ON<br />
                  설정 후 현장에서 다시 촬영해주세요
                </p>
              </div>
            )}

            <button
              onClick={resetAll}
              className="w-full py-4 bg-[#0EA5A0] text-white rounded-xl font-semibold"
            >
              다시 선택하기
            </button>
          </div>
        </div>
      )}

      {showLogin && (
        <LoginPrompt message="피드 업로드를 위해 로그인이 필요합니다" onClose={() => setShowLogin(false)} />
      )}
    </div>
  );
}
