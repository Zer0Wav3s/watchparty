"use client";

import Hls from "hls.js";
import { useEffect, useRef } from "react";

interface HlsPlayerProps {
  src: string;
  isPlaying: boolean;
  seekTo: number | null;
  seekThreshold?: number;
  onPlay: (position: number) => void;
  onPause: (position: number) => void;
  onSeek: (position: number) => void;
  onTimeUpdate?: (position: number) => void;
}

function proxyUrl(src: string): string {
  // Route external HLS streams through our CORS proxy
  try {
    const url = new URL(src, window.location.origin);
    if (url.origin === window.location.origin) return src;
    return `/api/proxy?url=${encodeURIComponent(src)}`;
  } catch {
    return src;
  }
}

export function HlsPlayer({
  src,
  isPlaying,
  seekTo,
  seekThreshold = 2,
  onPlay,
  onPause,
  onSeek,
  onTimeUpdate,
}: HlsPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const isApplyingSyncSeekRef = useRef(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    const proxied = proxyUrl(src);

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(proxied);
      hls.attachMedia(video);

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          // If HLS fails via proxy, try direct playback as last resort
          video.src = src;
        }
      });

      return () => {
        hls.destroy();
      };
    }

    // Safari has native HLS support
    video.src = proxied;
    return undefined;
  }, [src]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    if (isPlaying) {
      void video.play().catch(() => undefined);
      return;
    }

    video.pause();
  }, [isPlaying]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || seekTo === null || Number.isNaN(seekTo)) {
      return;
    }

    if (Math.abs(video.currentTime - seekTo) > seekThreshold) {
      isApplyingSyncSeekRef.current = true;
      video.currentTime = seekTo;
    }
  }, [seekThreshold, seekTo]);

  return (
    <video
      ref={videoRef}
      controls
      playsInline
      className="h-full w-full rounded-[24px] bg-black"
      onPlay={() => onPlay(videoRef.current?.currentTime ?? 0)}
      onPause={() => onPause(videoRef.current?.currentTime ?? 0)}
      onSeeked={() => {
        if (isApplyingSyncSeekRef.current) {
          isApplyingSyncSeekRef.current = false;
          return;
        }

        onSeek(videoRef.current?.currentTime ?? 0);
      }}
      onTimeUpdate={() => onTimeUpdate?.(videoRef.current?.currentTime ?? 0)}
    />
  );
}
