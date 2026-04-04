"use client";

import ReactPlayer from "react-player";
import { useEffect, useRef } from "react";

import type { VideoType } from "@/lib/types";

import { HlsPlayer } from "./HlsPlayer";

interface VideoPlayerProps {
  url: string | null;
  type: VideoType | null;
  isPlaying: boolean;
  seekTo: number | null;
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
  onPlay,
  onPause,
  onSeek,
  onTimeUpdate,
}: VideoPlayerProps) {
  const playerRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const player = playerRef.current;
    if (!player || seekTo === null || Number.isNaN(seekTo)) {
      return;
    }

    if (Math.abs((player.currentTime ?? 0) - seekTo) > 0.25) {
      player.currentTime = seekTo;
    }
  }, [seekTo]);

  if (!url || !type) {
    return (
      <div className="flex h-full min-h-[260px] w-full items-center justify-center rounded-[24px] border border-white/10 bg-slate-900/80 text-center text-zinc-400">
        <div className="space-y-2 px-6">
          <p className="text-lg font-medium text-white">No video loaded</p>
          <p className="text-sm text-zinc-400">The host can paste a YouTube, HLS, or MP4 URL to start the room.</p>
        </div>
      </div>
    );
  }

  if (type === "youtube") {
    return (
      <div className="overflow-hidden rounded-[24px] border border-white/10 bg-black">
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
          onSeeked={() => onSeek(playerRef.current?.currentTime ?? 0)}
          onTimeUpdate={() => onTimeUpdate?.(playerRef.current?.currentTime ?? 0)}
        />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[24px] border border-white/10 bg-black">
      <HlsPlayer
        src={url}
        isPlaying={isPlaying}
        seekTo={seekTo}
        onPlay={onPlay}
        onPause={onPause}
        onSeek={onSeek}
        onTimeUpdate={onTimeUpdate}
      />
    </div>
  );
}
