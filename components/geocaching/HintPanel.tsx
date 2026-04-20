'use client';

import { useState } from 'react';
import Image from 'next/image';

// ROT13 디코더 (지오캐싱 힌트 표준 암호화)
function rot13(str: string): string {
  return str.replace(/[a-zA-Z가-힣]/g, (c) => {
    // 영문만 ROT13 적용
    if (/[a-zA-Z]/.test(c)) {
      const base = c >= 'a' ? 97 : 65;
      return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
    }
    return c;
  });
}

interface Props {
  hintText?: string;
  hintPhotos: string[];
}

export default function HintPanel({ hintText, hintPhotos }: Props) {
  const [textRevealed, setTextRevealed] = useState(false);
  const [revealedPhotos, setRevealedPhotos] = useState<Set<number>>(new Set());
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const hasHint = (hintText && hintText.trim()) || hintPhotos.length > 0;
  if (!hasHint) return null;

  function revealPhoto(idx: number) {
    setRevealedPhotos(prev => new Set([...prev, idx]));
  }

  return (
    <div className="bg-[#FFFBEB] border border-amber-200 rounded-2xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-amber-200">
        <span className="text-lg">💡</span>
        <span className="font-semibold text-[#1A2F4B] text-sm">힌트</span>
        <span className="text-xs text-amber-600 ml-auto">스포일러 주의!</span>
      </div>

      <div className="p-4 space-y-4">
        {/* 사진 힌트 */}
        {hintPhotos.length > 0 && (
          <div>
            <p className="text-xs font-medium text-[#64748B] mb-2">사진 힌트 ({hintPhotos.length}장)</p>
            <div className="flex gap-2 flex-wrap">
              {hintPhotos.map((url, idx) => (
                <div key={idx} className="relative w-24 h-24 rounded-xl overflow-hidden border border-amber-200">
                  {revealedPhotos.has(idx) ? (
                    <>
                      <Image
                        src={url}
                        alt={`힌트 ${idx + 1}`}
                        fill
                        className="object-cover cursor-pointer"
                        onClick={() => setLightboxIdx(idx)}
                        unoptimized
                      />
                      <button
                        onClick={() => setLightboxIdx(idx)}
                        className="absolute inset-0 flex items-end justify-center pb-1"
                      >
                        <span className="text-[10px] bg-black/50 text-white px-1.5 py-0.5 rounded">확대</span>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => revealPhoto(idx)}
                      className="w-full h-full bg-amber-100 flex flex-col items-center justify-center gap-1 hover:bg-amber-200 transition-colors"
                    >
                      <span className="text-xl">🔍</span>
                      <span className="text-[10px] text-amber-700">힌트 {idx + 1}</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 텍스트 힌트 */}
        {hintText && hintText.trim() && (
          <div>
            <p className="text-xs font-medium text-[#64748B] mb-2">텍스트 힌트</p>
            {textRevealed ? (
              <div className="bg-white border border-amber-200 rounded-xl p-3">
                <p className="text-sm text-[#1A2F4B] leading-relaxed">{rot13(hintText)}</p>
                <button
                  onClick={() => setTextRevealed(false)}
                  className="mt-2 text-xs text-amber-600 hover:underline"
                >
                  다시 숨기기
                </button>
              </div>
            ) : (
              <button
                onClick={() => setTextRevealed(true)}
                className="w-full py-3 bg-amber-100 hover:bg-amber-200 rounded-xl text-sm text-amber-700 font-medium transition-colors"
              >
                🔓 텍스트 힌트 공개하기
              </button>
            )}
          </div>
        )}
      </div>

      {/* 라이트박스 */}
      {lightboxIdx !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightboxIdx(null)}
        >
          <div className="relative w-full max-w-lg aspect-square rounded-2xl overflow-hidden">
            <Image
              src={hintPhotos[lightboxIdx]}
              alt="힌트 확대"
              fill
              className="object-contain"
              unoptimized
            />
          </div>
          <button
            className="absolute top-4 right-4 text-white text-2xl"
            onClick={() => setLightboxIdx(null)}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
