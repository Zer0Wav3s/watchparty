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
      <div className="flex h-full min-h-[320px] w-full items-center justify-center bg-gradient-to-br from-fuchsia-100 to-pink-100 text-center sm:min-h-[400px]">
        <div className="flex max-w-sm flex-col items-center gap-8 px-8 py-10 transition-transform hover:scale-105 duration-300">
          <div className="flex h-24 w-24 items-center justify-center rounded-[32px] bg-white shadow-xl shadow-pink-200 rotation-3 animate-bounce">
            <span className="text-4xl text-pink-500">🍿</span>
          </div>
          <div className="space-y-4">
            <p className="text-2xl font-black tracking-tight text-slate-800">Waiting for popcorn...</p>
            <p className="text-lg font-medium text-slate-600">The host needs to pick something fun to watch.</p>
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
