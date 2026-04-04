"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";

import { PinGate } from "@/components/PinGate";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { UrlInput } from "@/components/UrlInput";
import { VideoPlayer } from "@/components/VideoPlayer";
import { ViewerCount } from "@/components/ViewerCount";
import { ThemeToggle } from "@/components/ThemeToggle";
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

  const socketRef = useRef<WebSocket | null>(null);
  const positionRef = useRef(0);
  const ignoreNextPlayRef = useRef(false);
  const ignoreNextPauseRef = useRef(false);
  const connectionIdRef = useRef<string | null>(null);

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

  useEffect(() => {
    if (typeof window === "undefined") return;
    setHostToken(sessionStorage.getItem(`watchparty:${roomId}:hostToken`));
    const pin = sessionStorage.getItem(`watchparty:${roomId}:pin`);
    if (pin) {
      setStoredPin(pin);
      sessionStorage.removeItem(`watchparty:${roomId}:pin`);
    }
  }, [roomId]);

  const handleServerMessage = useCallback((message: ServerMessage) => {
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

      case "error":
        setError(message.error);
        return;

      case "room-not-found":
        setError("Room not found.");
        return;

      default:
        return;
    }
  }, []);

  useEffect(() => {
    const socket = new WebSocket(getPartyKitWebSocketUrl(roomId, { hostToken, pin: storedPin }));
    socketRef.current = socket;

    socket.addEventListener("open", () => setIsConnecting(false));

    socket.addEventListener("message", (event) => {
      handleServerMessage(parseServerMessage(event as MessageEvent<string>));
    });

    socket.addEventListener("close", () => setIsConnecting(false));

    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, [hostToken, storedPin, roomId, handleServerMessage]);

  // Heartbeat: host sends position every 5 seconds
  useEffect(() => {
    if (!isHost || !isPlaying) return;

    const timer = setInterval(() => {
      sendPartyMessage(socketRef.current, { type: "heartbeat", position: positionRef.current });
    }, HEARTBEAT_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [isHost, isPlaying]);

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

  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-transparent p-4 sm:p-6 lg:p-8 relative overflow-hidden transition-colors duration-500">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_center,rgba(236,72,153,0.05),transparent_50%)] dark:bg-[radial-gradient(ellipse_at_top_center,rgba(6,182,212,0.05),transparent_50%)]" />
      
      {/* Background Blobs for Landing */}
      <div className="party-blob party-blob-one opacity-30 dark:opacity-10" />
      <div className="party-blob party-blob-two opacity-30 dark:opacity-10" />
      <div className="party-blob party-blob-three opacity-30 dark:opacity-10" />

      <Card className="relative z-10 flex w-full max-w-6xl flex-col bg-white/90 dark:bg-[#050505] shadow-2xl border-white/20 dark:border-white/10 backdrop-blur-xl">
        {/* Header */}
        <div className="flex flex-col gap-4 border-b border-fuchsia-500/10 dark:border-white/5 p-6 md:flex-row md:items-center md:justify-between md:px-8">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <p className="text-xs font-bold tracking-[0.15em] text-fuchsia-600 dark:text-cyan-500/70 uppercase">
                Session
              </p>
              <h1 className="font-mono text-xl font-bold tracking-tight text-slate-900 dark:text-white/90 sm:text-2xl">
                {roomId}
              </h1>
            </div>
            {isHost && <Badge variant="amber" className="ml-2">Admin</Badge>}
            <ThemeToggle />
          </div>
          <ViewerCount count={viewerCount} />
        </div>

        {/* Body */}
        <CardContent className="relative flex-1 p-4 md:p-8">
          {needsPin && (
            <div className="absolute inset-0 z-40 bg-white/60 dark:bg-black/60 backdrop-blur-md" />
          )}
          {needsPin && (
            <PinGate error={pinError} isLoading={isSubmittingPin} onSubmit={handlePinSubmit} />
          )}

          <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
            <UrlInput disabled={needsPin || isConnecting || extracting} isHost={isHost} onSubmit={handleVideoSubmit} />

            {error && (
              <p className="animate-in fade-in slide-in-from-top-2 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-6 py-4 text-sm font-medium text-rose-400">
                {error}
              </p>
            )}

            {extracting && (
              <div className="flex items-center gap-3 rounded-2xl border border-fuchsia-500/20 dark:border-cyan-500/20 bg-fuchsia-500/10 dark:bg-cyan-500/10 px-6 py-4">
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-fuchsia-400 dark:bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-fuchsia-500 dark:bg-cyan-500"></span>
                </span>
                <p className="text-sm font-bold tracking-wide text-fuchsia-600 dark:text-cyan-400">Negotiating stream source...</p>
              </div>
            )}

            <div className="group relative aspect-video w-full overflow-hidden rounded-[32px] border border-black/5 dark:border-white/5 bg-black shadow-2xl ring-1 ring-black/10 dark:ring-white/10">
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
    </main>
  );
}
