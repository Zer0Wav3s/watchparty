"use client";

import { motion } from "framer-motion";
import { Play, Popcorn, Sparkles } from "lucide-react";
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
      <div className="relative flex h-full min-h-[320px] w-full items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,#fdf2f8_0%,#f8fafc_48%,#ffffff_100%)] text-center sm:min-h-[400px] dark:bg-[radial-gradient(circle_at_top,#1e1b4b_0%,#111827_52%,#020617_100%)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(236,72,153,0.15),transparent_30%),radial-gradient(circle_at_78%_20%,rgba(139,92,246,0.12),transparent_26%),radial-gradient(circle_at_60%_78%,rgba(20,184,166,0.14),transparent_30%)]" />

        <motion.div
          className="absolute h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(236,72,153,0.18),transparent_70%)] dark:bg-[radial-gradient(circle,rgba(34,211,238,0.15),transparent_70%)]"
          animate={{ scale: [0.94, 1.08, 0.94], opacity: [0.55, 0.9, 0.55] }}
          transition={{ duration: 5.2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        />

        <div className="relative z-10 flex max-w-lg flex-col items-center gap-6 px-8 py-12 text-slate-800 dark:text-white">
          <div className="relative flex h-28 w-28 items-center justify-center rounded-[32px] border border-white/85 bg-white/90 shadow-[0_30px_80px_-35px_rgba(168,85,247,0.8)] dark:border-white/10 dark:bg-white/8">
            <Play className="h-10 w-10 fill-current text-fuchsia-500 dark:text-cyan-300" />
            <motion.div
              className="absolute -right-3 -top-3 flex h-11 w-11 items-center justify-center rounded-full border border-white/80 bg-white text-fuchsia-500 shadow-lg dark:border-white/10 dark:bg-slate-900 dark:text-cyan-300"
              animate={{ y: [0, -6, 0], rotate: [0, 8, 0] }}
              transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            >
              <Sparkles className="h-5 w-5" />
            </motion.div>
            <motion.div
              className="absolute -bottom-3 -left-3 flex h-11 w-11 items-center justify-center rounded-full border border-white/80 bg-white text-fuchsia-500 shadow-lg dark:border-white/10 dark:bg-slate-900 dark:text-cyan-300"
              animate={{ y: [0, 6, 0], rotate: [0, -8, 0] }}
              transition={{ duration: 4.6, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            >
              <Popcorn className="h-5 w-5" />
            </motion.div>
          </div>

          <div className="space-y-3">
            <p className="text-3xl font-black tracking-tight">Paste a link to get started</p>
            <p className="text-base font-medium leading-7 text-slate-600 dark:text-white/70">
              Queue up a YouTube, HLS, or video file above and WatchParty will keep the room together beat-for-beat.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm dark:border-white/10 dark:bg-white/8 dark:text-white/80">
            <Sparkles className="h-4 w-4 text-fuchsia-500 dark:text-cyan-300" />
            No awkward countdown required
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
