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
    <main className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-br from-fuchsia-100 via-pink-100 to-rose-200 px-4 py-8 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.8),transparent_50%)]" />
      <Card className="relative z-10 w-full max-w-2xl border-none shadow-[0_20px_50px_-12px_rgba(236,72,153,0.3)] bg-white/70 backdrop-blur-xl rounded-[48px]">
        <CardHeader className="space-y-6 text-center pb-6">
          <div className="mx-auto flex w-fit items-center gap-3 rounded-full border border-pink-200 bg-pink-100 px-5 py-2 shadow-sm">
            <span className="text-xl">🎉</span>
            <span className="text-sm font-black tracking-widest text-pink-600 uppercase">
              WatchParty
            </span>
          </div>
          <CardTitle className="text-4xl sm:text-5xl font-black text-slate-800 tracking-tight leading-tight">Sync up. Watch together.</CardTitle>
          <CardDescription className="mx-auto max-w-md text-xl font-medium text-slate-600">
            Create a room, share the link, and keep playback perfectly in sync. High-quality HLS and YouTube support.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col items-center pt-2 pb-10">
          <form className="w-full max-w-sm space-y-6" onSubmit={handleCreateRoom}>
            <label className="block relative group">
              <span className="block mb-2 text-sm font-bold tracking-wide text-slate-500 transition-colors group-focus-within:text-pink-500 ml-2">Room PIN (optional)</span>
              <Input
                value={pin}
                onChange={(event) => setPin(event.target.value)}
                maxLength={12}
                placeholder="Leave blank for a public room"
                className="h-16 rounded-3xl bg-white border-2 border-pink-100 focus:border-pink-400 focus:ring-4 focus:ring-pink-200/50 text-lg shadow-sm text-slate-800 placeholder:text-slate-400 transition-all font-medium"
              />
            </label>

            <Button type="submit" disabled={isLoading} size="lg" className="w-full h-16 rounded-3xl text-lg font-black tracking-wide bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white shadow-lg shadow-pink-500/30 transition-transform active:scale-95 border-none">
              {isLoading ? "Preparing the party..." : "Let's Party! ✨"}
            </Button>

            {error ? (
              <p className="animate-bounce text-center text-sm font-bold text-rose-500 mt-4 rounded-xl bg-rose-50 px-4 py-2 border border-rose-200">
                ⚠️ {error}
              </p>
            ) : null}
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
