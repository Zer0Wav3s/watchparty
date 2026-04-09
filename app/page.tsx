"use client";

import { motion } from "framer-motion";
import { LockKeyhole, MonitorPlay, Shield, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Footer } from "@/components/Footer";
import { ThemeToggle } from "@/components/ThemeToggle";
import { WatchPartyLogo } from "@/components/WatchPartyLogo";
import { Button } from "@/components/ui/button";
import { fireConfetti } from "@/lib/confetti";
import { Input } from "@/components/ui/input";

const containerVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut",
      staggerChildren: 0.1,
    },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
} as const;

const features = [
  {
    icon: Zap,
    title: "Instant Sync",
    description: "Play, pause, and seek together without drift.",
  },
  {
    icon: Shield,
    title: "PIN Protection",
    description: "Keep the room private with an optional join code.",
  },
  {
    icon: MonitorPlay,
    title: "YouTube & HLS",
    description: "Drop in a supported link and start the party fast.",
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
      await new Promise((resolve) => setTimeout(resolve, 400));
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
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="relative flex min-h-dvh flex-col px-6 py-16 md:px-8 md:py-24"
    >
      <div className="fixed top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center text-center">
        <motion.div variants={itemVariants} className="mb-8">
          <WatchPartyLogo size={64} />
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-4">
          <h1 className="text-5xl leading-[1.1] font-black text-slate-950 dark:text-white">
            Watch together, <span className="bg-[var(--party-gradient)] bg-clip-text text-transparent">from anywhere.</span>
          </h1>
          <p className="mx-auto max-w-xl text-lg font-medium text-slate-600 dark:text-slate-400">
            Create a room, share the link, and press play. Everyone stays in sync.
          </p>
        </motion.div>

        <motion.div variants={itemVariants} className="mt-10 w-full max-w-sm">
          <form onSubmit={handleCreateRoom} className="space-y-4">
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
              <Input
                value={pin}
                onChange={(event) => setPin(event.target.value)}
                maxLength={12}
                placeholder="Room PIN (optional)"
                className="h-14 rounded-full border-slate-200 pl-11 text-center dark:border-slate-800"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="h-14 w-full px-8 text-base"
            >
              {isLoading ? "Creating..." : "Create Room"}
            </Button>

            {error ? (
              <p className="rounded-2xl border border-red-200 bg-[var(--danger-surface)] px-4 py-3 text-center text-sm font-medium text-red-500 dark:border-red-950/50">
                {error}
              </p>
            ) : null}
          </form>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="mt-20 grid w-full grid-cols-1 gap-8 text-left md:grid-cols-3"
        >
          {features.map(({ icon: Icon, title, description }) => (
            <div key={title} className="space-y-3">
              <Icon className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              <div className="space-y-1.5">
                <h3 className="text-sm font-semibold text-slate-950 dark:text-slate-50">
                  {title}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {description}
                </p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      <Footer />
    </motion.main>
  );
}
