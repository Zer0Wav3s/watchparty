"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Crown, LogOut, Loader2, PartyPopper } from "lucide-react";
import { useRouter } from "next/navigation";
import { use, useCallback, useEffect, useRef, useState } from "react";

import { MediaControls } from "@/components/MediaControls";
import { ShareRoomLink } from "@/components/ShareRoomLink";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ToastContainer } from "@/components/Toast";
import type { ToastMessage } from "@/components/Toast";
import { UrlInput } from "@/components/UrlInput";
import { VideoPlayer } from "@/components/VideoPlayer";
import { ViewerCount } from "@/components/ViewerCount";
import { WatchPartyLogo } from "@/components/WatchPartyLogo";
import { PinGate } from "@/components/PinGate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fireConfetti } from "@/lib/confetti";
import { getPartyKitWebSocketUrl, parseServerMessage, sendPartyMessage } from "@/lib/partykit";
import type { ServerMessage, VideoType } from "@/lib/types";
import { isYouTubeUrl, normalizeUrl } from "@/lib/utils";

const HEARTBEAT_INTERVAL_MS = 5_000;
const DRIFT_THRESHOLD_SECS = 2;

interface RoomPageProps {
  params: Promise<{ id: string }>;
}

export default function RoomPage({ params }: RoomPageProps) {
  const resolvedParams = use(params);
  const roomId = resolvedParams.id;
  const router = useRouter();

  const socketRef = useRef<WebSocket | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoContainerRef = useRef<HTMLDivElement | null>(null);
  const positionRef = useRef(0);
  const ignoreNextPlayRef = useRef(false);
  const ignoreNextPauseRef = useRef(false);
  const connectionIdRef = useRef<string | null>(null);
  const previousViewerCountRef = useRef<number | null>(null);
  const toastTimeoutsRef = useRef<number[]>([]);

  const [hostToken, setHostToken] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const [needsPin, setNeedsPin] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [isSubmittingPin, setIsSubmittingPin] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [isHost, setIsHost] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoType, setVideoType] = useState<VideoType | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [seekTo, setSeekTo] = useState<number | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [storedPin, setStoredPin] = useState<string | null>(null);
  const [endingRoom, setEndingRoom] = useState(false);
  const [roomEnded, setRoomEnded] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((message: string) => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, message }]);

    const timeout = window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 3000);

    toastTimeoutsRef.current.push(timeout);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setHostToken(sessionStorage.getItem(`watchparty:${roomId}:hostToken`));
    const pin = sessionStorage.getItem(`watchparty:${roomId}:pin`);
    if (pin) {
      setStoredPin(pin);
      sessionStorage.removeItem(`watchparty:${roomId}:pin`);
    }
  }, [roomId]);

  useEffect(() => {
    const timeouts = toastTimeoutsRef.current;
    return () => {
      timeouts.forEach((timeout) => window.clearTimeout(timeout));
    };
  }, []);

  const handleServerMessage = useCallback(
    (message: ServerMessage) => {
      switch (message.type) {
        case "pin-required":
          setNeedsPin(true);
          return;
        case "auth-ok":
          setNeedsPin(false);
          setPinError(null);
          setIsSubmittingPin(false);
          setIsHost(message.isHost);
          connectionIdRef.current = message.connectionId;
          fireConfetti();
          return;
        case "auth-fail":
          setPinError(message.error);
          setIsSubmittingPin(false);
          return;
        case "sync":
          setViewerCount(message.viewers);
          setVideoUrl(message.videoUrl);
          setVideoType(message.videoType);
          setIsHost(message.isHost);
          setIsPlaying(message.isPlaying);
          setSeekTo(message.position);
          connectionIdRef.current = message.connectionId;
          return;
        case "viewer-count":
          setViewerCount(message.count);
          return;
        case "video-change":
          setVideoUrl(message.url);
          setVideoType(message.videoType);
          setIsPlaying(message.isPlaying);
          setSeekTo(message.position);
          return;
        case "host-changed":
          setIsHost(message.connectionId === connectionIdRef.current);
          return;
        case "play":
          ignoreNextPlayRef.current = true;
          setIsPlaying(true);
          setSeekTo(message.position);
          return;
        case "pause":
          ignoreNextPauseRef.current = true;
          setIsPlaying(false);
          setSeekTo(message.position);
          return;
        case "seek":
          setSeekTo(message.position);
          return;
        case "heartbeat": {
          const drift = Math.abs(positionRef.current - message.position);
          if (drift > DRIFT_THRESHOLD_SECS) {
            setSeekTo(message.position);
          }
          return;
        }
        case "room-ended":
          setRoomEnded(true);
          setEndingRoom(false);
          setIsPlaying(false);
          setError(null);
          addToast("This room has ended.");
          return;
        case "error":
          setEndingRoom(false);
          setError(message.error);
          return;
        case "room-not-found":
          setError("Room not found.");
          return;
        default:
          return;
      }
    },
    [addToast],
  );

  useEffect(() => {
    const socket = new WebSocket(getPartyKitWebSocketUrl(roomId, { hostToken, pin: storedPin }));
    socketRef.current = socket;

    socket.addEventListener("open", () => {
      setIsConnecting(false);
      setError(null);
    });

    socket.addEventListener("message", (event) => {
      handleServerMessage(parseServerMessage(event as MessageEvent<string>));
    });

    socket.addEventListener("close", () => {
      setIsConnecting(false);
      setEndingRoom(false);
    });

    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, [hostToken, storedPin, roomId, handleServerMessage]);

  useEffect(() => {
    if (!isHost || !isPlaying || roomEnded) return;

    const timer = window.setInterval(() => {
      sendPartyMessage(socketRef.current, { type: "heartbeat", position: positionRef.current });
    }, HEARTBEAT_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [isHost, isPlaying, roomEnded]);

  useEffect(() => {
    if (roomEnded) {
      socketRef.current?.close();
      const redirectTimer = window.setTimeout(() => {
        router.push("/");
      }, 3000);

      return () => window.clearTimeout(redirectTimer);
    }
  }, [roomEnded, router]);

  useEffect(() => {
    if (roomEnded) {
      previousViewerCountRef.current = viewerCount;
      return;
    }

    const previousCount = previousViewerCountRef.current;
    if (previousCount === null) {
      previousViewerCountRef.current = viewerCount;
      return;
    }

    if (viewerCount > previousCount) {
      const joinedCount = viewerCount - previousCount;
      addToast(joinedCount === 1 ? "Someone joined the watch party." : `${joinedCount} people joined the watch party.`);
    }

    if (viewerCount < previousCount) {
      const leftCount = previousCount - viewerCount;
      addToast(leftCount === 1 ? "Someone left the room." : `${leftCount} people left the room.`);
    }

    previousViewerCountRef.current = viewerCount;
  }, [viewerCount, roomEnded, addToast]);

  function handlePinSubmit(pin: string) {
    setIsSubmittingPin(true);
    sendPartyMessage(socketRef.current, { type: "pin-auth", pin, hostToken });
  }

  async function handleVideoSubmit(rawUrl: string) {
    setError(null);
    const url = normalizeUrl(rawUrl);

    if (isYouTubeUrl(url)) {
      sendPartyMessage(socketRef.current, { type: "set-video", url, videoType: "youtube" });
      return;
    }

    setExtracting(true);
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = (await res.json()) as { src?: string; type?: "hls" | "mp4"; error?: string };

      if (!res.ok || !data.src || !data.type) {
        setError(data.error || "Could not extract video from that URL.");
        return;
      }

      sendPartyMessage(socketRef.current, { type: "set-video", url: data.src, videoType: data.type });
    } catch {
      setError("Failed to extract video. Try a different URL.");
    } finally {
      setExtracting(false);
    }
  }

  function handlePlay(position: number) {
    if (ignoreNextPlayRef.current) {
      ignoreNextPlayRef.current = false;
      return;
    }
    setIsPlaying(true);
    sendPartyMessage(socketRef.current, { type: "play", position });
  }

  function handlePause(position: number) {
    if (ignoreNextPauseRef.current) {
      ignoreNextPauseRef.current = false;
      return;
    }
    setIsPlaying(false);
    sendPartyMessage(socketRef.current, { type: "pause", position });
  }

  function handleSeek(position: number) {
    sendPartyMessage(socketRef.current, { type: "seek", position });
  }

  function handleTimeUpdate(position: number) {
    positionRef.current = position;
  }

  function handleEndRoom() {
    const confirmed = window.confirm("End this room for everyone?");
    if (!confirmed) return;

    setEndingRoom(true);
    const sent = sendPartyMessage(socketRef.current, { type: "end-room" });

    if (!sent) {
      setEndingRoom(false);
      setError("Could not reach the room server. Try again.");
    }
  }

  function handleLocalPlay() {
    const position = videoRef.current?.currentTime ?? positionRef.current;
    handlePlay(position);
  }

  function handleLocalPause() {
    const position = videoRef.current?.currentTime ?? positionRef.current;
    handlePause(position);
  }

  function handleLocalSeek(time: number) {
    const video = videoRef.current;
    if (video) {
      video.currentTime = time;
    }

    handleSeek(time);
  }

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="flex min-h-dvh flex-col"
    >
      {/* Toasts */}
      <ToastContainer toasts={toasts} />

      {/* Header bar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-3 sm:px-6">
        {/* Left — Logo + Room ID */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <WatchPartyLogo size={32} linkTo="/" />
          <Badge variant="secondary" className="hidden text-sm sm:inline-flex">
            {roomId}
          </Badge>
          <ViewerCount count={viewerCount} />
        </div>

        {/* Right — Host badge + End Room + Theme Toggle */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {isHost ? (
            <Badge variant="amber" className="hidden gap-1.5 px-2.5 py-1 text-xs font-semibold sm:inline-flex">
              <Crown className="h-3.5 w-3.5" />
              Host
            </Badge>
          ) : null}

          {isHost ? (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={endingRoom || roomEnded}
              onClick={handleEndRoom}
              className="h-8 gap-1.5 rounded-lg px-2 text-xs font-semibold sm:px-3 sm:text-sm"
            >
              {endingRoom ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <LogOut className="h-3.5 w-3.5" />
              )}
              <span className="hidden sm:inline">End Room</span>
            </Button>
          ) : null}

          <ThemeToggle />
        </div>
      </header>

      {/* Shareable Room Link */}
      <ShareRoomLink roomId={roomId} />

      {/* Content */}
      <div className="flex flex-1 flex-col items-center px-3 py-4 sm:px-6 sm:py-6 md:px-12">
        {/* PIN gate overlay */}
        {needsPin ? (
          <PinGate error={pinError} isLoading={isSubmittingPin} onSubmit={handlePinSubmit} />
        ) : null}

        {/* Room ended overlay */}
        <AnimatePresence>
          {roomEnded ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            >
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center"
              >
                <PartyPopper className="mx-auto h-12 w-12 text-[var(--accent-primary)]" />
                <h2 className="mt-4 text-xl font-semibold text-[var(--text-primary)]">
                  This room has ended
                </h2>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  Redirecting to home...
                </p>
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Video area */}
        <div className="w-full max-w-[960px]">
          {/* URL input */}
          <div className="mb-4">
            <UrlInput
              disabled={needsPin || isConnecting || extracting || roomEnded}
              isHost={isHost}
              onSubmit={handleVideoSubmit}
            />
          </div>

          <div ref={videoContainerRef} className="w-full">
            <div
              className={`relative aspect-video w-full overflow-hidden border border-[var(--border)] bg-[var(--surface)] ${
                videoUrl && videoType && videoType !== "youtube" ? "rounded-t-xl rounded-b-none" : "rounded-xl"
              }`}
            >
              <VideoPlayer
                ref={videoRef}
                url={videoUrl}
                type={videoType}
                isPlaying={isPlaying}
                seekTo={seekTo}
                seekThreshold={DRIFT_THRESHOLD_SECS}
                onPlay={handlePlay}
                onPause={handlePause}
                onSeek={handleSeek}
                onTimeUpdate={handleTimeUpdate}
              />
              {/* Click-to-pause overlay (non-YouTube only) */}
              {videoUrl && videoType && videoType !== "youtube" ? (
                <button
                  type="button"
                  className="absolute inset-0 z-10 cursor-pointer bg-transparent"
                  onClick={() => { if (isPlaying) handleLocalPause(); else handleLocalPlay(); }}
                  aria-label={isPlaying ? "Pause video" : "Play video"}
                />
              ) : null}
            </div>

            {videoUrl && videoType && videoType !== "youtube" ? (
              <MediaControls
                videoRef={videoRef}
                containerRef={videoContainerRef}
                isPlaying={isPlaying}
                onPlay={handleLocalPlay}
                onPause={handleLocalPause}
                onSeek={handleLocalSeek}
              />
            ) : null}
          </div>

          {/* Error display */}
          {error ? (
            <p className="mt-4 rounded-xl border border-[var(--danger)] bg-[var(--danger)]/10 px-4 py-3 text-sm font-medium text-[var(--danger)]">
              {error}
            </p>
          ) : null}

          {/* Extracting indicator */}
          {extracting ? (
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
              <Loader2 className="h-4 w-4 animate-spin text-[var(--accent-primary)]" />
              <p className="text-sm text-[var(--text-secondary)]">
                Finding the best stream source...
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </motion.main>
  );
}
