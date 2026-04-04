"use client";

import { CirclePlay } from "lucide-react";
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
      <div className="flex h-full min-h-[320px] w-full items-center justify-center bg-[var(--surface)] text-center sm:min-h-[400px]">
        <div className="flex flex-col items-center gap-4 px-8 py-12">
          <CirclePlay className="h-16 w-16 text-[var(--text-muted)]" />
          <div className="space-y-2">
            <p className="text-lg text-[var(--text-secondary)]">
              Paste a link below to start watching
            </p>
            <p className="text-sm text-[var(--text-muted)]">
              YouTube, HLS streams, and direct video links supported
            </p>
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
