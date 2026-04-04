"use client";

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
      <DialogContent showClose={false} className="z-50 w-11/12 max-w-sm sm:max-w-md">
        <DialogHeader className="space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/10 ring-1 ring-cyan-500/20">
            <svg className="h-8 w-8 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <DialogTitle className="text-center">Restricted access.</DialogTitle>
          <DialogDescription className="text-center text-base">
            This session is protected by a PIN.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-6">
          <div className="relative group">
            <Input
              value={pin}
              onChange={(event) => setPin(event.target.value)}
              placeholder="Enter PIN"
              type="password"
              className="h-14 w-full rounded-2xl bg-black/50 text-center text-xl tracking-widest text-zinc-100 outline-none transition-colors"
            />
          </div>

          <Button type="submit" disabled={isLoading} size="lg" className="w-full text-base font-bold tracking-wide">
            {isLoading ? "Authenticating..." : "Join session"}
          </Button>

          {error ? (
            <p className="animate-in fade-in slide-in-from-bottom-2 text-center text-sm font-medium text-rose-400">
              {error}
            </p>
          ) : null}
        </form>
      </DialogContent>
    </Dialog>
  );
}
