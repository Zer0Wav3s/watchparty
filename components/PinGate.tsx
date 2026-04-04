"use client";

import { LockKeyhole } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface PinGateProps {
  onSubmit: (pin: string) => Promise<void> | void;
  error?: string | null;
  isLoading?: boolean;
}

export function PinGate({ onSubmit, error, isLoading }: PinGateProps) {
  const [pin, setPin] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit(pin);
  }

  return (
    <Dialog open>
      <DialogContent>
        <DialogHeader className="space-y-4 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--bg)] text-[var(--accent-primary)]">
            <LockKeyhole className="h-7 w-7" />
          </div>
          <div className="space-y-2">
            <DialogTitle>This room is PIN protected</DialogTitle>
            <DialogDescription>Enter the PIN to join this watch party.</DialogDescription>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
            <Input
              value={pin}
              onChange={(event) => setPin(event.target.value)}
              placeholder="Enter PIN"
              type="password"
              className="h-12 pl-10"
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="h-12 w-full rounded-xl text-base font-bold"
          >
            {isLoading ? "Verifying..." : "Join Room"}
          </Button>

          {error ? (
            <p className="rounded-xl border border-[var(--danger)] bg-[var(--danger)]/10 px-4 py-3 text-center text-sm font-medium text-[var(--danger)]">
              {error}
            </p>
          ) : null}
        </form>
      </DialogContent>
    </Dialog>
  );
}
