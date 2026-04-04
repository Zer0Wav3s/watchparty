"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Crown, DoorClosed, Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { use, useCallback, useEffect, useRef, useState } from "react";

import { PinGate } from "@/components/PinGate";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UrlInput } from "@/components/UrlInput";
import { VideoPlayer } from "@/components/VideoPlayer";
import { ViewerCount } from "@/components/ViewerCount";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getPartyKitWebSocketUrl, parseServerMessage, sendPartyMessage } from "@/lib/partykit";
import type { ServerMessage, VideoType } from "@/lib/types";
import { isYouTubeUrl, normalizeUrl } from "@/lib/utils";

const HEARTBEAT_INTERVAL_MS = 5_000;
const DRIFT_THRESHOLD_SECS = 2;

interface RoomPageProps {
  params: Promise<{ id: string }>;
}

interface ToastMessage {
  id: number;
  message: string;
  tone?: "default" | "danger";
}

export default function RoomPage({ params }: RoomPageProps) {
  const resolvedParams = use(params);
  const roomId = resolvedParams.id;
  const router = useRouter();

  const socketRef = useRef<WebSocket | null>(null);
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

  const addToast = useCallback((message: string, tone: ToastMessage["tone"] = "default") => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, message, tone }]);

    const timeout = window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 2600);

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
          addToast("This room has ended.", "danger");
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
    if (!confirmed) {
      return;
    }

    setEndingRoom(true);
    const sent = sendPartyMessage(socketRef.current, { type: "end-room" });

    if (!sent) {
      setEndingRoom(false);
      setError("Could not reach the room server. Try again.");
    }
  }

  return (
    <main className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-transparent p-4 sm:p-6 lg:p-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.7),transparent_34%),radial-gradient(circle_at_18%_18%,rgba(236,72,153,0.12),transparent_30%),radial-gradient(circle_at_82%_16%,rgba(139,92,246,0.15),transparent_28%),radial-gradient(circle_at_65%_82%,rgba(20,184,166,0.14),transparent_30%)] dark:bg-[radial-gradient(circle_at_top,rgba(15,23,42,0.35),transparent_34%),radial-gradient(circle_at_18%_18%,rgba(236,72,153,0.12),transparent_30%),radial-gradient(circle_at_82%_16%,rgba(34,211,238,0.12),transparent_28%),radial-gradient(circle_at_65%_82%,rgba(20,184,166,0.12),transparent_30%)]" />
      <div className="party-blob party-blob-one opacity-35 dark:opacity-15" />
      <div className="party-blob party-blob-two opacity-35 dark:opacity-15" />
      <div className="party-blob party-blob-three opacity-35 dark:opacity-15" />

      <AnimatePresence>
        {toasts.length > 0 ? (
          <motion.div
            className="pointer-events-none fixed right-4 top-4 z-[80] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3 sm:right-6 sm:top-6"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            {toasts.map((toast) => (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: -10, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.96 }}
                transition={{ duration: 0.2 }}
                className={`rounded-[24px] border px-4 py-3 text-sm font-semibold shadow-[0_24px_60px_-35px_rgba(15,23,42,0.85)] backdrop-blur-xl ${
                  toast.tone === "danger"
                    ? "border-rose-200 bg-rose-50/90 text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/12 dark:text-rose-100"
                    : "border-white/80 bg-white/88 text-slate-700 dark:border-white/10 dark:bg-slate-950/75 dark:text-white/85"
                }`}
              >
                {toast.message}
              </motion.div>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="relative z-10 w-full max-w-6xl"
      >
        <Card className="overflow-hidden border-white/70 bg-white/88 backdrop-blur-2xl dark:border-white/10 dark:bg-[#05070d]/86">
          <div className="flex flex-col gap-5 border-b border-fuchsia-500/10 p-5 sm:p-6 md:flex-row md:items-center md:justify-between md:px-8 dark:border-white/8">
            <div className="flex flex-wrap items-center gap-3">
              <div className="space-y-1">
                <p className="text-xs font-black tracking-[0.18em] text-fuchsia-600 uppercase dark:text-cyan-300/80">Watch room</p>
                <h1 className="font-mono text-xl font-black tracking-tight text-slate-900 sm:text-2xl dark:text-white">{roomId}</h1>
              </div>
              {isHost ? (
                <Badge variant="amber" className="gap-2 px-4 py-2 text-xs">
                  <Crown className="h-3.5 w-3.5" />
                  Host
                </Badge>
              ) : null}
              {isConnecting ? (
                <Badge variant="outline" className="gap-2 px-4 py-2 text-xs">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Connecting
                </Badge>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-3 md:justify-end">
              <ViewerCount count={viewerCount} />
              <ThemeToggle />
              {isHost ? (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={endingRoom || roomEnded}
                  onClick={handleEndRoom}
                  className="h-11 rounded-full px-5 text-sm font-black"
                >
                  {endingRoom ? <Loader2 className="h-4 w-4 animate-spin" /> : <DoorClosed className="h-4 w-4" />}
                  End room
                </Button>
              ) : null}
            </div>
          </div>

          <CardContent className="relative p-4 md:p-8">
            {needsPin ? <div className="absolute inset-0 z-40 bg-white/60 backdrop-blur-md dark:bg-black/60" /> : null}
            {needsPin ? <PinGate error={pinError} isLoading={isSubmittingPin} onSubmit={handlePinSubmit} /> : null}

            <AnimatePresence>
              {roomEnded ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-30 flex items-center justify-center rounded-[28px] bg-white/80 px-6 text-center backdrop-blur-md dark:bg-slate-950/82"
                >
                  <div className="max-w-md space-y-4">
                    <div className="mx-auto flex h-18 w-18 items-center justify-center rounded-full bg-rose-100 text-rose-500 dark:bg-rose-500/12 dark:text-rose-200">
                      <DoorClosed className="h-8 w-8" />
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">This room has ended</h2>
                      <p className="text-base font-medium leading-7 text-slate-600 dark:text-white/65">
                        The host closed the party. Sending you back home in a couple seconds.
                      </p>
                    </div>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>

            <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 md:gap-8">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-semibold tracking-[0.12em] text-slate-500 uppercase dark:text-white/50">
                    Queue the night
                  </p>
                  <p className="text-base font-medium text-slate-600 dark:text-white/65">
                    Hosts can drop the next link. Everyone else just shows up and vibes.
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/82 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm dark:border-white/10 dark:bg-white/6 dark:text-white/80">
                  <Sparkles className="h-4 w-4 text-fuchsia-500 dark:text-cyan-300" />
                  Playback stays synced across the room
                </div>
              </div>

              <UrlInput disabled={needsPin || isConnecting || extracting || roomEnded} isHost={isHost} onSubmit={handleVideoSubmit} />

              {error ? (
                <p className="rounded-[24px] border border-rose-200 bg-rose-50 px-6 py-4 text-sm font-medium text-rose-600 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200">
                  {error}
                </p>
              ) : null}

              {extracting ? (
                <div className="flex items-center gap-3 rounded-[24px] border border-fuchsia-200 bg-fuchsia-50/85 px-6 py-4 dark:border-cyan-400/20 dark:bg-cyan-400/10">
                  <span className="relative flex h-3 w-3">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-fuchsia-400 opacity-75 dark:bg-cyan-300" />
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-fuchsia-500 dark:bg-cyan-300" />
                  </span>
                  <p className="text-sm font-bold tracking-wide text-fuchsia-700 dark:text-cyan-100">Finding the best stream source...</p>
                </div>
              ) : null}

              <div className="group relative aspect-video w-full overflow-hidden rounded-[32px] border border-black/5 bg-black shadow-[0_40px_100px_-42px_rgba(15,23,42,0.9)] ring-1 ring-black/10 dark:border-white/8 dark:ring-white/10">
                <VideoPlayer
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
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}
