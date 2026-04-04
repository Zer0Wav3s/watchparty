"use client";

import { motion } from "framer-motion";
import { LockKeyhole, MonitorPlay, Play, Shield, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Footer } from "@/components/Footer";
import { ThemeToggle } from "@/components/ThemeToggle";
import { WatchPartyLogo } from "@/components/WatchPartyLogo";
import { Button } from "@/components/ui/button";
import { fireConfetti } from "@/lib/confetti";
import { Input } from "@/components/ui/input";

const cardEase = [0.16, 1, 0.3, 1] as const;

const features = [
  {
    icon: Zap,
    title: "Instant Sync",
    description:
      "Play, pause, and seek — everyone stays perfectly in sync, no matter where they are.",
  },
  {
    icon: Shield,
    title: "PIN Protection",
    description:
      "Lock your room with an optional PIN so only invited friends can join the party.",
  },
  {
    icon: MonitorPlay,
    title: "YouTube & HLS",
    description:
      "Paste any YouTube link or HLS stream and start watching together instantly.",
  },
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pin.trim() || null }),
      });

      if (!response.ok) {
        throw new Error("Failed to create room");
      }

      const data = (await response.json()) as { roomId: string; pin: boolean };

      if (typeof window !== "undefined" && pin.trim()) {
        sessionStorage.setItem(`watchparty:${data.roomId}:pin`, pin.trim());
      }

      fireConfetti();
      // Small delay so confetti is visible before navigation
      await new Promise((r) => setTimeout(r, 400));
      router.push(`/room/${data.roomId}`);
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Something went wrong",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="relative flex min-h-dvh flex-col items-center px-6 pt-24 pb-0 md:pt-32"
    >
      {/* Theme toggle — fixed top-right */}
      <div className="fixed top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      {/* Hero section */}
      <div className="flex w-full flex-col items-center">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: cardEase }}
          className="mb-6"
        >
          <WatchPartyLogo size={64} />
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05, ease: cardEase }}
          className="text-center text-4xl font-extrabold text-[var(--text-primary)]"
        >
          Watch Together, From Anywhere
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: cardEase }}
          className="mx-auto mt-4 max-w-md text-center text-lg font-normal text-[var(--text-secondary)]"
        >
          Create a room, share the link, press play. Everyone stays in sync.
        </motion.p>

        {/* PIN Input & Create Room */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: cardEase }}
          className="mx-auto mt-10 w-full max-w-sm"
        >
          <form onSubmit={handleCreateRoom}>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
              <Input
                value={pin}
                onChange={(event) => setPin(event.target.value)}
                maxLength={12}
                placeholder="Room PIN (optional)"
                className="h-12 rounded-xl pl-10"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="mt-4 h-12 w-full rounded-xl text-base font-semibold"
            >
              <Play className="h-[18px] w-[18px]" />
              {isLoading ? "Creating..." : "Create Room"}
            </Button>

            {error ? (
              <p className="mt-4 rounded-xl border border-[var(--danger)] bg-[var(--danger)]/10 px-4 py-3 text-center text-sm font-medium text-[var(--danger)]">
                {error}
              </p>
            ) : null}
          </form>
        </motion.div>

        {/* Feature Cards */}
        <div className="mx-auto mt-24 grid w-full max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
          {features.map(({ icon: Icon, title, description }, index) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.5,
                delay: 0.2 + index * 0.08,
                ease: cardEase,
              }}
              className="cursor-pointer rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 transition-all duration-300 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:shadow-lg"
            >
              <Icon className="h-8 w-8 text-[var(--accent-primary)]" />
              <h3 className="mt-4 mb-2 text-lg font-semibold text-[var(--text-primary)]">
                {title}
              </h3>
              <p className="text-base font-normal leading-relaxed text-[var(--text-secondary)]">
                {description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="mt-8 sm:mt-0" />
      <Footer />
    </motion.main>
  );
}
