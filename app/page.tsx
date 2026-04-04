"use client";

import { motion } from "framer-motion";
import { LockKeyhole, MonitorPlay, Play, Shield, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const cardEase = [0.16, 1, 0.3, 1] as const;

const features = [
  { icon: Zap, label: "Instant sync" },
  { icon: Shield, label: "PIN protection" },
  { icon: MonitorPlay, label: "YouTube & HLS" },
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

      router.push(`/room/${data.roomId}`);
    } catch (createError) {
      setError(
        createError instanceof Error ? createError.message : "Something went wrong",
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
      className="relative flex min-h-dvh items-center justify-center px-6 py-8 md:px-12"
    >
      {/* Theme toggle — absolute top-right */}
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      <div className="flex w-full max-w-lg flex-col items-center">
        {/* Main card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: cardEase }}
          className="w-full"
        >
          <Card>
            <CardContent className="space-y-6 p-8">
              {/* Headline */}
              <div className="text-center">
                <h1 className="text-4xl leading-[1.2] font-extrabold text-[var(--text-primary)]">
                  Watch together, from anywhere.
                </h1>
                <p className="mx-auto mt-2 max-w-sm text-lg leading-[1.5] font-normal text-[var(--text-secondary)]">
                  Create a room, share the link, press play. Everyone stays in sync.
                </p>
              </div>

              {/* Form */}
              <form className="space-y-3" onSubmit={handleCreateRoom}>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                  <Input
                    value={pin}
                    onChange={(event) => setPin(event.target.value)}
                    maxLength={12}
                    placeholder="Room PIN (optional)"
                    className="h-12 pl-10"
                  />
                </div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                >
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="h-12 w-full rounded-xl text-base font-bold hover:shadow-[0_4px_16px_rgba(139,92,246,0.3)]"
                  >
                    <Play className="h-[18px] w-[18px]" />
                    {isLoading ? "Creating..." : "Create Room"}
                  </Button>
                </motion.div>

                {error ? (
                  <p className="rounded-xl border border-[var(--danger)] bg-[var(--danger)]/10 px-4 py-3 text-center text-sm font-medium text-[var(--danger)]">
                    {error}
                  </p>
                ) : null}
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Feature section */}
        <div className="mt-8 flex items-center justify-center gap-8">
          {features.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2">
              <Icon className="h-6 w-6 text-[var(--accent-primary)]" />
              <span className="text-sm font-medium text-[var(--text-secondary)]">
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-[var(--text-muted)]">
          WatchParty
        </p>
      </div>
    </motion.main>
  );
}
