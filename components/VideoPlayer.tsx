"use client";

import { Pause, Play, Sparkles } from "lucide-react";
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
      <div className="flex h-full min-h-[320px] w-full items-center justify-center bg-[radial-gradient(circle_at_top,#fbcfe8_0%,#f1f5f9_58%,#ffffff_100%)] dark:bg-[radial-gradient(circle_at_top,#312e81_0%,#111827_58%,#020617_100%)] text-center sm:min-h-[400px]">
        <div className="flex max-w-md flex-col items-center gap-6 px-8 py-12 text-slate-800 dark:text-white">
          <div className="flex h-24 w-24 items-center justify-center rounded-[30px] bg-fuchsia-500/10 dark:bg-white/10 shadow-lg shadow-fuchsia-500/20 ring-1 ring-fuchsia-500/20 dark:ring-white/20">
            <Sparkles className="h-10 w-10 text-fuchsia-500 dark:text-pink-300" />
          </div>
          <div className="space-y-3">
            <p className="text-2xl font-black tracking-tight">Waiting for the first drop</p>
            <p className="text-base font-medium text-slate-600 dark:text-white/70">
              The host can paste a video link above and everyone in the room will stay in sync.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-300 dark:border-white/15 bg-white/50 dark:bg-white/8 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-white/80">
            {isPlaying ? <Play className="h-4 w-4 fill-current text-fuchsia-500 dark:text-white" /> : <Pause className="h-4 w-4 text-fuchsia-500 dark:text-white" />}
            Ready when you are
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
