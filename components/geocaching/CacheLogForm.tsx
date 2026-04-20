'use client';

import { useState, ChangeEvent } from 'react';
import { LogType } from '@/types';

const LOG_OPTIONS: { type: LogType; icon: string; label: string; color: string }[] = [
  { type: 'found',             icon: '😊', label: '찾았어요!',     color: 'border-green-400 bg-green-50 text-green-700' },
  { type: 'dnf',               icon: '😞', label: '못 찾았어요',   color: 'border-red-300 bg-red-50 text-red-600' },
  { type: 'note',              icon: '📝', label: '메모',          color: 'border-blue-300 bg-blue-50 text-blue-600' },
  { type: 'needs_maintenance', icon: '🔧', label: '관리 필요',     color: 'border-orange-300 bg-orange-50 text-orange-600' },
];

interface Props {
  cacheId: string;
  hasGift: boolean;
  onSubmit: (data: {
    type: LogType;
    comment: string;
    photoFile?: File;
    isGiftClaimed: boolean;
  }) => Promise<void>;
  onCancel: () => void;
}

export default function CacheLogForm({ hasGift, onSubmit, onCancel }: Props) {
  const [logType, setLogType] = useState<LogType>('found');
  const [comment, setComment] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isGiftClaimed, setIsGiftClaimed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function handlePhoto(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setPhotoFile(f);
    setPhotoPreview(URL.createObjectURL(f));
  }

  async function handleSubmit() {
    if (!comment.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit({ type: logType, comment, photoFile: photoFile ?? undefined, isGiftClaimed });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-[#E2E8F0] flex items-center gap-2">
        <span className="text-lg">📋</span>
        <span className="font-semibold text-[#1A2F4B] text-sm">로그 작성</span>
      </div>

      <div className="p-4 space-y-4">
        {/* 로그 타입 선택 */}
        <div className="grid grid-cols-2 gap-2">
          {LOG_OPTIONS.map(opt => (
            <button
              key={opt.type}
              onClick={() => setLogType(opt.type)}
              className={`py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${
                logType === opt.type ? opt.color : 'border-[#E2E8F0] bg-white text-[#64748B]'
              }`}
            >
              {opt.icon} {opt.label}
            </button>
          ))}
        </div>

        {/* 선물 수령 여부 (found + hasGift) */}
        {logType === 'found' && hasGift && (
          <label className="flex items-center gap-3 p-3 bg-[#FFF7ED] border border-orange-200 rounded-xl cursor-pointer">
            <input
              type="checkbox"
              checked={isGiftClaimed}
              onChange={e => setIsGiftClaimed(e.target.checked)}
              className="w-4 h-4 accent-[#0EA5A0]"
            />
            <span className="text-sm text-[#1A2F4B]">🎁 선물을 가져갔어요</span>
          </label>
        )}

        {/* 코멘트 */}
        <div>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder={
              logType === 'found' ? '어떻게 찾으셨나요? 감사 인사나 소감을 남겨보세요!'
              : logType === 'dnf' ? '어디를 찾아봤나요? 다음 방문자에게 도움이 될 메모를 남겨보세요.'
              : logType === 'needs_maintenance' ? '어떤 부분이 관리가 필요한지 알려주세요.'
              : '자유롭게 메모를 남겨보세요.'
            }
            rows={4}
            className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm resize-none outline-none focus:border-[#0EA5A0]"
          />
          <p className="text-right text-[10px] text-[#94A3B8] mt-1">{comment.length}자</p>
        </div>

        {/* 사진 첨부 */}
        <div>
          <label className="text-xs font-medium text-[#64748B] block mb-2">사진 첨부 (선택)</label>
          {photoPreview ? (
            <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-[#E2E8F0]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoPreview} alt="미리보기" className="w-full h-full object-cover" />
              <button
                onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                className="absolute top-2 right-2 bg-black/50 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>
          ) : (
            <label className="flex items-center justify-center w-full h-24 border-2 border-dashed border-[#E2E8F0] rounded-xl cursor-pointer hover:border-[#0EA5A0] transition-colors">
              <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
              <span className="text-sm text-[#94A3B8]">📷 사진 선택</span>
            </label>
          )}
        </div>

        {/* 버튼 */}
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-3 border border-[#E2E8F0] rounded-xl text-sm text-[#64748B] hover:bg-[#F8FAFC]"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={!comment.trim() || submitting}
            className="flex-1 py-3 bg-[#0EA5A0] text-white rounded-xl text-sm font-semibold disabled:opacity-40"
          >
            {submitting ? '제출 중...' : '로그 등록'}
          </button>
        </div>
      </div>
    </div>
  );
}
