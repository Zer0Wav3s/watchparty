"use client";

import { CirclePlay } from "lucide-react";
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
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

export const VideoPlayer = forwardRef<HTMLVideoElement, VideoPlayerProps>(
  function VideoPlayer(
    {
      url,
      type,
      isPlaying,
      seekTo,
      seekThreshold = 2,
      onPlay,
      onPause,
      onSeek,
      onTimeUpdate,
    }: VideoPlayerProps,
    forwardedRef,
  ) {
    const playerRef = useRef<HTMLVideoElement | null>(null);
    const isApplyingSyncSeekRef = useRef(false);

    useImperativeHandle(forwardedRef, () => playerRef.current!, [playerRef]);

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
        <div className="flex h-full w-full items-center justify-center bg-slate-100 p-4 text-center dark:bg-slate-900">
          <div className="flex flex-col items-center gap-3 sm:gap-4">
            <CirclePlay className="h-16 w-16 text-slate-300" />
            <div className="space-y-1 sm:space-y-2">
              <p className="text-sm text-slate-500 sm:text-base">
                Waiting for the host to drop a link...
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
          ref={playerRef}
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
  },
);
