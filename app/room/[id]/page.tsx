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

  useEffect(() => {
    if (typeof window === "undefined") return;
    setHostToken(sessionStorage.getItem(`watchparty:${roomId}:hostToken`));
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
    const socket = new WebSocket(getPartyKitWebSocketUrl(roomId, hostToken));
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
  }, [hostToken, roomId, handleServerMessage]);

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
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <Card className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-6xl flex-col bg-slate-950/70 p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col gap-4 border-b border-white/10 pb-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-sm text-cyan-200">Room</p>
              <h1 className="text-2xl font-semibold text-white sm:text-3xl">{roomId}</h1>
            </div>
            {isHost && <Badge variant="amber">Host</Badge>}
          </div>
          <ViewerCount count={viewerCount} />
        </div>

        {/* Body */}
        <CardContent className="relative mt-6 flex-1 rounded-[28px] border border-dashed border-white/10 bg-black/30 p-4 md:p-6">
          {needsPin && (
            <PinGate error={pinError} isLoading={isSubmittingPin} onSubmit={handlePinSubmit} />
          )}

          <div className="space-y-6">
            <UrlInput disabled={needsPin || isConnecting || extracting} isHost={isHost} onSubmit={handleVideoSubmit} />

            {error && (
              <p className="rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
                {error}
              </p>
            )}

            {extracting && (
              <p className="text-sm text-zinc-400">Extracting video source…</p>
            )}

            <div className="aspect-video">
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
