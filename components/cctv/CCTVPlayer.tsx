'use client';

import { useEffect, useRef } from 'react';
import { getProxyUrl } from '@/lib/utils/hls';

interface CCTVPlayerProps {
  streamUrl: string;
  autoplay?: boolean;
  muted?: boolean;
  controls?: boolean;
  className?: string;
}

export default function CCTVPlayer({
  streamUrl,
  autoplay = true,
  muted = true,
  controls = true,
  className = '',
}: CCTVPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<import('hls.js').default | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const proxyUrl = getProxyUrl(streamUrl);

    async function initPlayer() {
      const Hls = (await import('hls.js')).default;

      if (Hls.isSupported()) {
        hlsRef.current = new Hls({ enableWorker: false });
        hlsRef.current.loadSource(proxyUrl);
        hlsRef.current.attachMedia(video!);
        if (autoplay) {
          hlsRef.current.on(Hls.Events.MANIFEST_PARSED, () => {
            video!.play().catch(() => {});
          });
        }
      } else if (video!.canPlayType('application/vnd.apple.mpegurl')) {
        // Safari 네이티브 HLS
        video!.src = proxyUrl;
        if (autoplay) video!.play().catch(() => {});
      }
    }

    initPlayer();

    return () => {
      hlsRef.current?.destroy();
    };
  }, [streamUrl, autoplay]);

  return (
    <video
      ref={videoRef}
      muted={muted}
      controls={controls}
      playsInline
      className={`w-full h-full object-cover bg-black ${className}`}
    />
  );
}
