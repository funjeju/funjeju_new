'use client';

import { CCTVLocation } from '@/types';
import LiveBadge from '@/components/ui/LiveBadge';

interface Props {
  cctv: CCTVLocation;
  onClose: () => void;
}

export default function CCTVPopup({ cctv, onClose }: Props) {
  function openStream() {
    if (cctv.ubinWrId) {
      window.open(
        `http://ubin.onpr.co.kr/bbs/board.php?bo_table=cctv&wr_id=${cctv.ubinWrId}`,
        '_blank',
        'noopener,noreferrer'
      );
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50" onClick={onClose}>
      <div className="w-full max-w-lg bg-white rounded-t-2xl md:rounded-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E2E8F0]">
          <div>
            <div className="flex items-center gap-2">
              <LiveBadge />
              <span className="font-semibold text-[#1A2F4B]">{cctv.name}</span>
            </div>
            <p className="text-xs text-[#64748B] mt-0.5">{cctv.region}</p>
          </div>
          <button onClick={onClose} className="text-[#64748B] hover:text-[#1A2F4B] text-xl leading-none">✕</button>
        </div>

        {/* 영상 보기 영역 */}
        <div className="aspect-video bg-gray-900 flex flex-col items-center justify-center gap-4 px-6">
          <p className="text-white/60 text-sm text-center">
            📡 제주도 공식 CCTV 실시간 영상
          </p>
          <p className="text-white/40 text-xs text-center">
            보안상 새 창에서 재생됩니다
          </p>
          {cctv.ubinWrId ? (
            <button
              onClick={openStream}
              className="px-6 py-3 bg-[#0EA5A0] text-white rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-[#0D7A76] transition-colors"
            >
              📺 실시간 영상 보기
            </button>
          ) : (
            <p className="text-white/30 text-xs">영상 링크 준비 중</p>
          )}
        </div>

        {/* 태그 */}
        <div className="px-4 py-3">
          <div className="flex flex-wrap gap-1.5">
            {cctv.tags.map(tag => (
              <span key={tag} className="text-xs bg-[#E0F7F6] text-[#0EA5A0] px-2 py-0.5 rounded-full">{tag}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
