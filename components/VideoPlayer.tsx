"use client";

import { useEffect, useRef } from "react";
import ReactPlayer from "react-player";

import type { VideoType } from "@/lib/types";

import { HlsPlayer } from "./HlsPlayer";

interface VideoPlayerProps {
  url: string | null;
  type: VideoType | null;
  isPlaying: boolean;
  seekTo: number | null;
  seekThreshold?: number;
  onPlay: (position: number) => void;
  onPause: (position: number) => void;
  onSeek: (position: number) => void;
  onTimeUpdate?: (position: number) => void;
}

export function VideoPlayer({
  url,
  type,
  isPlaying,
  seekTo,
  seekThreshold = 2,
  onPlay,
  onPause,
  onSeek,
  onTimeUpdate,
}: VideoPlayerProps) {
  const playerRef = useRef<HTMLVideoElement | null>(null);
  const isApplyingSyncSeekRef = useRef(false);

  useEffect(() => {
    const player = playerRef.current;
    if (!player || seekTo === null || Number.isNaN(seekTo)) {
      return;
    }

    if (Math.abs((player.currentTime ?? 0) - seekTo) > seekThreshold) {
      isApplyingSyncSeekRef.current = true;
      player.currentTime = seekTo;
    }
  }, [seekThreshold, seekTo]);

  if (!url || !type) {
    return (
      <div className="flex h-full min-h-[320px] w-full items-center justify-center bg-black/40 text-center backdrop-blur-sm sm:min-h-[400px]">
        <div className="flex max-w-sm flex-col items-center gap-6 px-8 py-10 opacity-70 transition-opacity hover:opacity-100">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10">
            <svg className="h-8 w-8 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="space-y-3">
            <p className="text-xl font-bold tracking-tight text-white/90">Awaiting signal</p>
            <p className="text-base font-medium text-zinc-500">The channel admin must provide a source to begin the session.</p>
          </div>
        </div>
      </div>
    );
  }

  if (type === "youtube") {
    return (
      <div className="h-full w-full bg-black">
        <ReactPlayer
          ref={playerRef}
          src={url}
          controls
          playing={isPlaying}
          width="100%"
          height="100%"
          playsInline
          onPlay={() => onPlay(playerRef.current?.currentTime ?? 0)}
          onPause={() => onPause(playerRef.current?.currentTime ?? 0)}
          onSeeked={() => {
            if (isApplyingSyncSeekRef.current) {
              isApplyingSyncSeekRef.current = false;
              return;
            }

            onSeek(playerRef.current?.currentTime ?? 0);
          }}
          onTimeUpdate={() => onTimeUpdate?.(playerRef.current?.currentTime ?? 0)}
        />
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-black">
      <HlsPlayer
        src={url}
        isPlaying={isPlaying}
        seekTo={seekTo}
        seekThreshold={seekThreshold}
        onPlay={onPlay}
        onPause={onPause}
        onSeek={onSeek}
        onTimeUpdate={onTimeUpdate}
      />
    </div>
  );
}
