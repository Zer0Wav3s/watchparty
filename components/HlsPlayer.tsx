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

    if (src.includes(".m3u8") && Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(src);
      hls.attachMedia(video);

      return () => {
        hls.destroy();
      };
    }

    video.src = src;
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
