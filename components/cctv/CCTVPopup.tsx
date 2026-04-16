'use client';

import { CCTVLocation } from '@/types';
import CCTVPlayer from './CCTVPlayer';
import LiveBadge from '@/components/ui/LiveBadge';

interface Props {
  cctv: CCTVLocation;
  onClose: () => void;
}

export default function CCTVPopup({ cctv, onClose }: Props) {
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

        {/* 플레이어 */}
        <div className="aspect-video bg-black">
          <CCTVPlayer streamUrl={cctv.streamUrl} autoplay muted />
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
