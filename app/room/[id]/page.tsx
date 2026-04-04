"use client";

import { use, useEffect, useRef, useState } from "react";

import { PinGate } from "@/components/PinGate";
import { UrlInput } from "@/components/UrlInput";
import { ViewerCount } from "@/components/ViewerCount";
import { getPartyKitWebSocketUrl, parseServerMessage, sendPartyMessage } from "@/lib/partykit";
import type { ServerMessage, VideoType } from "@/lib/types";

interface RoomPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function RoomPage({ params }: RoomPageProps) {
  const resolvedParams = use(params);
  const roomId = resolvedParams.id;
  const socketRef = useRef<WebSocket | null>(null);
  const [hostToken, setHostToken] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const [needsPin, setNeedsPin] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [isSubmittingPin, setIsSubmittingPin] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [isHost, setIsHost] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoType, setVideoType] = useState<VideoType | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    setHostToken(sessionStorage.getItem(`watchparty:${roomId}:hostToken`));
  }, [roomId]);

  useEffect(() => {
    const socket = new WebSocket(getPartyKitWebSocketUrl(roomId, hostToken));
    socketRef.current = socket;

    socket.addEventListener("open", () => {
      setIsConnecting(false);
    });

    socket.addEventListener("message", (event) => {
      const message = parseServerMessage(event as MessageEvent<string>);
      handleServerMessage(message);
    });

    socket.addEventListener("close", () => {
      setIsConnecting(false);
    });

    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, [hostToken, roomId]);

  function handleServerMessage(message: ServerMessage) {
    switch (message.type) {
      case "pin-required": {
        setNeedsPin(true);
        return;
      }
      case "auth-ok": {
        setNeedsPin(false);
        setPinError(null);
        setIsSubmittingPin(false);
        setIsHost(message.isHost);
        return;
      }
      case "auth-fail": {
        setPinError(message.error);
        setIsSubmittingPin(false);
        return;
      }
      case "sync": {
        setViewerCount(message.viewers);
        setVideoUrl(message.videoUrl);
        setVideoType(message.videoType);
        setIsHost(message.isHost);
        return;
      }
      case "viewer-count": {
        setViewerCount(message.count);
        return;
      }
      case "video-change": {
        setVideoUrl(message.url);
        setVideoType(message.videoType);
        return;
      }
      case "host-changed": {
        return;
      }
      default:
        return;
    }
  }

  async function handlePinSubmit(pin: string) {
    setIsSubmittingPin(true);
    sendPartyMessage(socketRef.current, {
      type: "pin-auth",
      pin,
      hostToken,
    });
  }

  async function handleVideoSubmit(_url: string) {
    return;
  }

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-6xl flex-col rounded-[32px] border border-white/10 bg-slate-950/70 p-4 shadow-2xl shadow-black/40 backdrop-blur md:p-6">
        <div className="flex flex-col gap-4 border-b border-white/10 pb-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-cyan-200">Room</p>
            <h1 className="text-2xl font-semibold text-white sm:text-3xl">{roomId}</h1>
          </div>
          <ViewerCount count={viewerCount} />
        </div>

        <section className="relative mt-6 flex-1 rounded-[28px] border border-dashed border-white/10 bg-black/30 p-4 md:p-6">
          {needsPin ? (
            <PinGate error={pinError} isLoading={isSubmittingPin} onSubmit={handlePinSubmit} />
          ) : null}

          <div className="space-y-6">
            <UrlInput disabled={needsPin || isConnecting} isHost={isHost} onSubmit={handleVideoSubmit} />

            <div className="flex aspect-video items-center justify-center rounded-[24px] border border-white/10 bg-slate-900/80 text-center text-zinc-400">
              {videoUrl && videoType ? (
                <div className="space-y-2 px-6">
                  <p className="text-sm uppercase tracking-[0.2em] text-cyan-200">Video ready</p>
                  <p className="break-all text-sm text-zinc-300">{videoUrl}</p>
                </div>
              ) : (
                <div className="space-y-2 px-6">
                  <p className="text-lg font-medium text-white">Player loading next</p>
                  <p className="text-sm text-zinc-400">The synced player gets wired up in the next build step.</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
