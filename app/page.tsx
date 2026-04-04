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

      const data = (await response.json()) as { roomId: string; hostToken: string | null };

      if (typeof window !== "undefined") {
        if (data.hostToken) {
          sessionStorage.setItem(`watchparty:${data.roomId}:hostToken`, data.hostToken);
        } else {
          sessionStorage.removeItem(`watchparty:${data.roomId}:hostToken`);
        }
      }

      router.push(`/room/${data.roomId}`);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <Card className="w-full max-w-xl">
        <CardHeader className="space-y-4 p-8 pb-0">
          <span className="inline-flex w-fit rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold tracking-[0.24em] text-cyan-200 uppercase">
            WatchParty MVP
          </span>
          <CardTitle className="text-4xl sm:text-5xl">Synced rooms for watching video together.</CardTitle>
          <CardDescription className="text-sm leading-6 sm:text-base">
            Create a private room, drop in a video link, and keep playback locked in sync for your group.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-8 pt-10">
          <form className="space-y-5" onSubmit={handleCreateRoom}>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-zinc-200">Optional room PIN</span>
              <Input
                value={pin}
                onChange={(event) => setPin(event.target.value)}
                maxLength={12}
                placeholder="Leave blank for a public room"
                className="h-12 rounded-2xl bg-black/30"
              />
            </label>

            <Button type="submit" disabled={isLoading} className="h-12 w-full rounded-2xl text-base">
              {isLoading ? "Creating room..." : "Create room"}
            </Button>

            {error ? <p className="text-sm text-rose-300">{error}</p> : null}
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
