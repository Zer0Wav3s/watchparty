"use client";

import {
  Maximize,
  Minimize,
  Pause,
  Play,
  Volume2,
  VolumeX,
} from "lucide-react";
import {
  type ChangeEvent,
  type RefObject,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MediaControlsProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  containerRef: RefObject<HTMLElement | null>;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (time: number) => void;
}

function formatTime(value: number): string {
  if (!Number.isFinite(value) || value < 0) {
    return "00:00";
  }

  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);

  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
}

export function MediaControls({
  videoRef,
  containerRef,
  isPlaying,
  onPlay,
  onPause,
  onSeek,
}: MediaControlsProps) {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const lastVolumeRef = useRef(1);

  useEffect(() => {
    let frameId = 0;

    const syncState = () => {
      const video = videoRef.current;
      if (video) {
        setCurrentTime(video.currentTime || 0);
        setDuration(video.duration || 0);
        setVolume(video.volume);
        setIsMuted(video.muted || video.volume === 0);
      }

      frameId = window.requestAnimationFrame(syncState);
    };

    frameId = window.requestAnimationFrame(syncState);

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [videoRef]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const container = containerRef.current;
      setIsFullscreen(Boolean(container && document.fullscreenElement === container));
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [containerRef]);

  const displayTime = useMemo(
    () => `${formatTime(currentTime)} / ${formatTime(duration)}`,
    [currentTime, duration],
  );

  function handleTogglePlayback() {
    if (isPlaying) {
      onPause();
      return;
    }

    onPlay();
  }

  function handleSeekChange(event: ChangeEvent<HTMLInputElement>) {
    onSeek(Number(event.target.value));
  }

  function handleVolumeChange(event: ChangeEvent<HTMLInputElement>) {
    const nextVolume = Number(event.target.value);
    const video = videoRef.current;
    if (!video) return;

    video.volume = nextVolume;
    video.muted = nextVolume === 0;

    if (nextVolume > 0) {
      lastVolumeRef.current = nextVolume;
    }

    setVolume(nextVolume);
    setIsMuted(nextVolume === 0);
  }

  function handleToggleMute() {
    const video = videoRef.current;
    if (!video) return;

    if (video.muted || video.volume === 0) {
      const restoredVolume = lastVolumeRef.current > 0 ? lastVolumeRef.current : 1;
      video.muted = false;
      video.volume = restoredVolume;
      setVolume(restoredVolume);
      setIsMuted(false);
      return;
    }

    lastVolumeRef.current = video.volume > 0 ? video.volume : lastVolumeRef.current;
    video.muted = true;
    setIsMuted(true);
  }

  async function handleToggleFullscreen() {
    const container = containerRef.current;
    if (!container) return;

    if (document.fullscreenElement === container) {
      await document.exitFullscreen();
      return;
    }

    await container.requestFullscreen();
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-b-xl border border-t-0 border-[var(--border)] bg-[var(--surface)] px-4 py-3">
      <Button
        type="button"
        variant={isPlaying ? "default" : "outline"}
        size="sm"
        onClick={handleTogglePlayback}
        className="h-10 min-w-10 cursor-pointer rounded-full px-3 hover:opacity-80"
        aria-label={isPlaying ? "Pause video" : "Play video"}
      >
        {isPlaying ? <Pause size={20} /> : <Play size={20} />}
      </Button>

      <span className="font-mono text-sm text-[var(--text-secondary)]">
        {displayTime}
      </span>

      <input
        type="range"
        min={0}
        max={duration || 0}
        step={0.1}
        value={Math.min(currentTime, duration || 0)}
        onChange={handleSeekChange}
        className={cn(
          "h-1 min-w-[140px] flex-1 cursor-pointer accent-[var(--accent-primary)]",
          "rounded-full",
        )}
        aria-label="Seek video"
      />

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleToggleMute}
          className="cursor-pointer text-[var(--text-secondary)] transition-opacity hover:opacity-80"
          aria-label={isMuted ? "Unmute video" : "Mute video"}
        >
          {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>

        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={isMuted ? 0 : volume}
          onChange={handleVolumeChange}
          className="h-1 w-20 cursor-pointer accent-[var(--accent-primary)] rounded-full"
          aria-label="Video volume"
        />
      </div>

      <button
        type="button"
        onClick={handleToggleFullscreen}
        className="cursor-pointer text-[var(--text-secondary)] transition-opacity hover:opacity-80"
        aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
      >
        {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
      </button>
    </div>
  );
}
