"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";

import { PinGate } from "@/components/PinGate";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { UrlInput } from "@/components/UrlInput";
import { VideoPlayer } from "@/components/VideoPlayer";
import { ViewerCount } from "@/components/ViewerCount";
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
    // Read and clear the PIN (only used once for lazy room init)
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
    <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-gradient-to-br from-purple-100 via-fuchsia-100 to-pink-200 p-4 sm:p-6 lg:p-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.7),transparent_60%)]" />
      <Card className="relative z-10 flex w-full max-w-6xl flex-col bg-white/70 backdrop-blur-2xl rounded-[48px] border-none shadow-[0_30px_60px_-15px_rgba(217,70,239,0.25)]">
        {/* Header */}
        <div className="flex flex-col gap-6 border-b border-fuchsia-200/50 p-8 sm:p-10 md:flex-row md:items-center md:justify-between -m-px">
          <div className="flex items-center gap-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br from-fuchsia-500 to-pink-500 shadow-lg shadow-pink-500/30">
              <span className="text-2xl">🍿</span>
            </div>
            <div className="flex flex-col">
              <p className="text-sm font-black tracking-widest text-fuchsia-500 uppercase">
                Room Code
              </p>
              <h1 className="font-sans text-3xl font-black tracking-tighter text-slate-800 sm:text-4xl">
                {roomId}
              </h1>
            </div>
            {isHost && <Badge variant="amber" className="ml-4 px-4 py-1.5 text-sm bg-amber-100 text-amber-700 border-amber-200 shadow-sm rounded-full">👑 Host</Badge>}
          </div>
          <ViewerCount count={viewerCount} />
        </div>

        {/* Body */}
        <CardContent className="relative flex-1 p-6 md:p-10 lg:p-12">
          {needsPin && (
            <div className="absolute inset-0 z-40 bg-fuchsia-900/40 backdrop-blur-xl rounded-b-[48px]" />
          )}
          {needsPin && (
            <PinGate error={pinError} isLoading={isSubmittingPin} onSubmit={handlePinSubmit} />
          )}

          <div className="mx-auto flex w-full max-w-5xl flex-col gap-10">
            <UrlInput disabled={needsPin || isConnecting || extracting} isHost={isHost} onSubmit={handleVideoSubmit} />

            {error && (
              <div className="animate-bounce rounded-3xl border-2 border-rose-200 bg-rose-50 px-8 py-5 shadow-sm">
                <p className="text-base font-bold text-rose-600 flex items-center gap-3">
                  <span className="text-xl">💥</span> {error}
                </p>
              </div>
            )}

            {extracting && (
              <div className="flex items-center gap-4 rounded-3xl border-2 border-fuchsia-200 bg-fuchsia-50 px-8 py-5 shadow-sm">
                 <span className="text-2xl animate-spin">✨</span>
                <p className="text-base font-bold tracking-wide text-fuchsia-700">Brewing the magic...</p>
              </div>
            )}

            <div className="group relative aspect-video w-full overflow-hidden rounded-[40px] bg-slate-900 shadow-[0_20px_40px_-5px_rgba(0,0,0,0.3)] ring-4 ring-white/40">
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
