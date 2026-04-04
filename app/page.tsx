"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function HomePage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreateRoom(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pin: pin.trim() || null }),
      });

      if (!response.ok) {
        throw new Error("Failed to create room");
      }

      const data = (await response.json()) as { roomId: string; pin: boolean };

      // Store the PIN in sessionStorage so the room page can pass it to PartyKit
      // on first connection (lazy room initialization)
      if (typeof window !== "undefined" && pin.trim()) {
        sessionStorage.setItem(`watchparty:${data.roomId}:pin`, pin.trim());
      }

      router.push(`/room/${data.roomId}`);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-slate-950 px-4 py-8 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_center,rgba(6,182,212,0.15),transparent_50%)]" />
      <Card className="relative z-10 w-full max-w-2xl">
        <CardHeader className="space-y-6 text-center">
          <div className="mx-auto flex w-fit items-center gap-3 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-1.5 backdrop-blur">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-500"></span>
            </span>
            <span className="text-xs font-bold tracking-[0.15em] text-cyan-400/90 uppercase">
              WatchParty MVP
            </span>
          </div>
          <CardTitle>Synced playback for private viewing.</CardTitle>
          <CardDescription className="mx-auto max-w-md text-lg">
            Create a room, share the link, and keep playback perfectly in sync. High-quality HLS and YouTube support.
          </CardDescription>
        </CardHeader>

        <CardContent className="mt-6 flex flex-col items-center">
          <form className="w-full max-w-sm space-y-6" onSubmit={handleCreateRoom}>
            <label className="block space-y-3 relative group">
              <span className="text-sm font-semibold tracking-wide text-zinc-400 transition-colors group-focus-within:text-cyan-400">Optional room PIN</span>
              <Input
                value={pin}
                onChange={(event) => setPin(event.target.value)}
                maxLength={12}
                placeholder="Leave blank for a public room"
                className="h-14 rounded-2xl bg-black/50 text-base"
              />
            </label>

            <Button type="submit" disabled={isLoading} size="lg" className="w-full text-base font-bold tracking-wide">
              {isLoading ? "Provisioning..." : "Create room"}
            </Button>

            {error ? (
              <p className="animate-in fade-in slide-in-from-bottom-2 text-center text-sm font-medium text-rose-400">
                {error}
              </p>
            ) : null}
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
