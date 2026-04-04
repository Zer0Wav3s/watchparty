"use client";

import { motion } from "framer-motion";
import { Link2, Play, Sparkles, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const featureCards = [
  {
    icon: Users,
    title: "Instant shared vibe",
    description: "Drop into one room and keep every friend on the same beat, even miles apart.",
  },
  {
    icon: Link2,
    title: "Paste. Press play. Done.",
    description: "YouTube, HLS, and direct links load fast without turning setup into homework.",
  },
  {
    icon: Sparkles,
    title: "Private when you want it",
    description: "Add a PIN for invite-only nights and keep the party to your people.",
  },
] as const;

const floatingBits = [
  { left: "8%", top: "12%", delay: 0, duration: 8, size: 12 },
  { left: "18%", top: "72%", delay: 1.1, duration: 10, size: 10 },
  { left: "32%", top: "18%", delay: 0.4, duration: 9, size: 8 },
  { left: "48%", top: "78%", delay: 1.7, duration: 11, size: 14 },
  { left: "64%", top: "14%", delay: 0.8, duration: 8.5, size: 10 },
  { left: "82%", top: "24%", delay: 0.2, duration: 10.5, size: 12 },
  { left: "90%", top: "74%", delay: 1.3, duration: 9.5, size: 9 },
] as const;

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
    <main className="relative flex min-h-[100dvh] overflow-hidden bg-transparent px-4 py-8 sm:px-6 lg:px-8">
      <div className="absolute right-4 top-4 z-50 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.75),transparent_36%),radial-gradient(circle_at_20%_20%,rgba(244,114,182,0.16),transparent_32%),radial-gradient(circle_at_80%_15%,rgba(167,139,250,0.2),transparent_28%),radial-gradient(circle_at_60%_80%,rgba(45,212,191,0.18),transparent_30%)] dark:bg-[radial-gradient(circle_at_top,rgba(15,23,42,0.35),transparent_36%),radial-gradient(circle_at_20%_20%,rgba(236,72,153,0.16),transparent_32%),radial-gradient(circle_at_80%_15%,rgba(34,211,238,0.14),transparent_28%),radial-gradient(circle_at_60%_80%,rgba(45,212,191,0.16),transparent_30%)]" />
      <div className="party-blob party-blob-one" />
      <div className="party-blob party-blob-two" />
      <div className="party-blob party-blob-three" />

      {floatingBits.map((bit) => (
        <motion.span
          key={`${bit.left}-${bit.top}`}
          className="pointer-events-none absolute rounded-full bg-white/70 shadow-[0_10px_30px_-18px_rgba(236,72,153,0.8)] dark:bg-white/20"
          style={{ left: bit.left, top: bit.top, width: bit.size, height: bit.size }}
          animate={{ y: [0, -18, 0], opacity: [0.25, 0.8, 0.25], rotate: [0, 18, -12, 0] }}
          transition={{ duration: bit.duration, delay: bit.delay, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        />
      ))}

      <motion.div
        className="relative z-10 mx-auto flex w-full max-w-6xl flex-col justify-center gap-8 py-10 lg:py-16"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
      >
        <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10">
          <motion.section
            className="space-y-8"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/65 px-4 py-2 text-sm font-semibold text-slate-700 shadow-[0_18px_40px_-28px_rgba(168,85,247,0.7)] backdrop-blur dark:border-white/10 dark:bg-slate-950/55 dark:text-white/75">
              <Sparkles className="h-4 w-4 text-fuchsia-500 dark:text-cyan-300" />
              Your couch crew, fully synced
            </div>

            <div className="space-y-5">
              <h1 className="max-w-2xl text-5xl font-black tracking-[-0.04em] text-slate-900 sm:text-6xl lg:text-7xl dark:text-white">
                Watch together,
                <span className="block bg-[linear-gradient(135deg,#ec4899_0%,#8b5cf6_55%,#14b8a6_100%)] bg-clip-text text-transparent">
                  from anywhere.
                </span>
              </h1>
              <p className="max-w-xl text-lg font-medium leading-8 text-slate-600 sm:text-xl dark:text-white/70">
                Start a room, invite your people, and turn any link into a movie night that actually feels social.
                Private PINs, synced playback, and a little more personality than the average sterile watch app.
              </p>
            </div>

            <form className="max-w-xl space-y-4" onSubmit={handleCreateRoom}>
              <label className="block space-y-3">
                <span className="text-sm font-semibold tracking-[0.12em] text-slate-500 uppercase dark:text-white/55">
                  Optional room PIN
                </span>
                <Input
                  value={pin}
                  onChange={(event) => setPin(event.target.value)}
                  maxLength={12}
                  placeholder="Leave blank for an open room"
                  className="h-16 rounded-[28px] border-white/80 bg-white/85 px-5 text-base shadow-[0_28px_80px_-36px_rgba(168,85,247,0.85)] backdrop-blur dark:border-white/10 dark:bg-slate-950/60 dark:text-white dark:placeholder:text-white/35"
                />
              </label>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button type="submit" disabled={isLoading} size="lg" className="h-16 rounded-[28px] px-8 text-base font-black tracking-[0.04em]">
                  <Play className="h-5 w-5 fill-current" />
                  {isLoading ? "Starting the room..." : "Create room"}
                </Button>
                <p className="text-sm font-medium text-slate-500 dark:text-white/55">
                  Share the link. Hit play. Let the chaos be coordinated.
                </p>
              </div>

              {error ? (
                <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
                  {error}
                </p>
              ) : null}
            </form>
          </motion.section>

          <motion.section
            className="relative"
            initial={{ opacity: 0, x: 20, y: 12 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 0.7, delay: 0.12 }}
          >
            <Card className="relative overflow-hidden border-white/65 bg-white/75 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/65">
              <div className="absolute inset-x-10 top-8 h-32 rounded-full bg-fuchsia-400/18 blur-3xl dark:bg-cyan-400/16" />
              <CardContent className="relative flex min-h-[420px] flex-col justify-between p-8 sm:p-10">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-200/70 bg-fuchsia-50/80 px-4 py-2 text-xs font-black tracking-[0.18em] text-fuchsia-700 uppercase dark:border-cyan-400/20 dark:bg-cyan-400/10 dark:text-cyan-200">
                    <Sparkles className="h-4 w-4" />
                    Live room energy
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">The group chat, but with a play button.</h2>
                    <p className="text-sm leading-7 text-slate-600 dark:text-white/65">
                      One host. One stream. Everyone locked in — whether it’s comfort rewatch season or a chaotic late-night link spiral.
                    </p>
                  </div>
                </div>

                <div className="relative flex flex-1 items-center justify-center py-10">
                  <motion.div
                    className="absolute h-60 w-60 rounded-full bg-[radial-gradient(circle,rgba(236,72,153,0.18),transparent_65%)] dark:bg-[radial-gradient(circle,rgba(34,211,238,0.18),transparent_65%)]"
                    animate={{ scale: [0.96, 1.05, 0.96], opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 5.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                  />

                  <div className="relative flex h-36 w-36 items-center justify-center rounded-full border border-white/80 bg-white shadow-[0_40px_100px_-38px_rgba(168,85,247,0.8)] dark:border-white/10 dark:bg-slate-900">
                    <Play className="h-12 w-12 fill-current text-fuchsia-500 dark:text-cyan-300" />
                    <span className="absolute inset-0 rounded-full ring-8 ring-fuchsia-200/55 dark:ring-cyan-400/10" />
                  </div>

                  <motion.div
                    className="absolute left-[10%] top-[18%] flex h-16 w-16 items-center justify-center rounded-full border border-white/80 bg-white/92 text-xl shadow-lg dark:border-white/10 dark:bg-slate-900/90"
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 4.2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                  >
                    🍿
                  </motion.div>
                  <motion.div
                    className="absolute right-[9%] top-[28%] flex h-16 w-16 items-center justify-center rounded-full border border-white/80 bg-white/92 text-xl shadow-lg dark:border-white/10 dark:bg-slate-900/90"
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 4.7, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                  >
                    🎬
                  </motion.div>
                  <motion.div
                    className="absolute bottom-[10%] left-[22%] flex h-16 w-16 items-center justify-center rounded-full border border-white/80 bg-white/92 text-xl shadow-lg dark:border-white/10 dark:bg-slate-900/90"
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 4.4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                  >
                    💬
                  </motion.div>
                  <motion.div
                    className="absolute bottom-[14%] right-[19%] flex h-16 w-16 items-center justify-center rounded-full border border-white/80 bg-white/92 text-xl shadow-lg dark:border-white/10 dark:bg-slate-900/90"
                    animate={{ y: [0, 9, 0] }}
                    transition={{ duration: 5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                  >
                    ✨
                  </motion.div>

                  <div className="pointer-events-none absolute inset-0">
                    <span className="absolute left-[27%] top-[35%] h-px w-28 bg-gradient-to-r from-fuchsia-300/0 via-fuchsia-400/70 to-fuchsia-300/0 dark:via-cyan-300/60" />
                    <span className="absolute right-[28%] top-[41%] h-px w-24 bg-gradient-to-r from-fuchsia-300/0 via-violet-400/70 to-fuchsia-300/0 dark:via-cyan-300/60" />
                    <span className="absolute bottom-[30%] left-[31%] h-px w-24 rotate-[24deg] bg-gradient-to-r from-fuchsia-300/0 via-teal-400/70 to-fuchsia-300/0 dark:via-cyan-300/60" />
                    <span className="absolute bottom-[31%] right-[31%] h-px w-24 -rotate-[24deg] bg-gradient-to-r from-fuchsia-300/0 via-violet-400/70 to-fuchsia-300/0 dark:via-cyan-300/60" />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {featureCards.map(({ icon: Icon, title }) => (
                    <div key={title} className="rounded-[24px] border border-white/75 bg-white/78 p-4 text-center shadow-[0_20px_45px_-34px_rgba(15,23,42,0.45)] dark:border-white/10 dark:bg-white/5">
                      <Icon className="mx-auto mb-3 h-5 w-5 text-fuchsia-500 dark:text-cyan-300" />
                      <p className="text-sm font-bold text-slate-700 dark:text-white/80">{title}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.section>
        </div>

        <motion.section
          className="grid gap-4 md:grid-cols-3"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.22 }}
        >
          {featureCards.map(({ icon: Icon, title, description }, index) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.28 + index * 0.08 }}
            >
              <Card className="h-full border-white/65 bg-white/72 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/55">
                <CardContent className="space-y-4 p-6">
                  <div className="flex h-14 w-14 items-center justify-center rounded-[22px] bg-[linear-gradient(135deg,rgba(236,72,153,0.12),rgba(20,184,166,0.12))] ring-1 ring-white/80 dark:ring-white/10">
                    <Icon className="h-6 w-6 text-fuchsia-600 dark:text-cyan-300" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">{title}</h3>
                    <p className="text-sm leading-7 text-slate-600 dark:text-white/65">{description}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.section>
      </motion.div>
    </main>
  );
}
