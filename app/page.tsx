"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

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
      <section className="w-full max-w-xl rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/30 backdrop-blur">
        <div className="space-y-4">
          <span className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold tracking-[0.24em] text-cyan-200 uppercase">
            WatchParty MVP
          </span>
          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Synced rooms for watching video together.
          </h1>
          <p className="text-sm leading-6 text-zinc-300 sm:text-base">
            Create a private room, drop in a video link, and keep playback locked in sync for your group.
          </p>
        </div>

        <form className="mt-10 space-y-5" onSubmit={handleCreateRoom}>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-zinc-200">Optional room PIN</span>
            <input
              value={pin}
              onChange={(event) => setPin(event.target.value)}
              maxLength={12}
              placeholder="Leave blank for a public room"
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-cyan-400/60"
            />
          </label>

          <button
            type="submit"
            disabled={isLoading}
            className="flex h-12 w-full items-center justify-center rounded-2xl bg-cyan-400 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-cyan-400/60"
          >
            {isLoading ? "Creating room..." : "Create room"}
          </button>

          {error ? <p className="text-sm text-rose-300">{error}</p> : null}
        </form>
      </section>
    </main>
  );
}
