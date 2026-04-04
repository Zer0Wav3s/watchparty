"use client";

import { LockKeyhole, Sparkles } from "lucide-react";
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
      <DialogContent showClose={false} className="z-[100] w-11/12 max-w-sm rounded-[36px] border-fuchsia-200 bg-white/96 p-8 shadow-[0_30px_80px_-28px_rgba(168,85,247,0.55)] sm:max-w-md">
        <DialogHeader className="space-y-5 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] bg-[linear-gradient(135deg,#fdf2f8_0%,#f5d0fe_45%,#ccfbf1_100%)] shadow-inner">
            <LockKeyhole className="h-9 w-9 text-fuchsia-600" />
          </div>
          <div className="space-y-2">
            <DialogTitle className="text-3xl font-black tracking-tight text-slate-800">VIP access only</DialogTitle>
            <DialogDescription className="text-base font-medium text-slate-600">
              This room is PIN protected. Drop the code and get back to the party.
            </DialogDescription>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-fuchsia-400" />
            <Input
              value={pin}
              onChange={(event) => setPin(event.target.value)}
              placeholder="Enter PIN"
              type="password"
              className="h-16 rounded-[28px] border-fuchsia-200 bg-white pl-14 pr-5 text-lg text-slate-800 placeholder:text-slate-400"
            />
          </div>

          <Button type="submit" disabled={isLoading} size="lg" className="w-full rounded-[28px] text-lg font-black tracking-wide">
            <Sparkles className="h-5 w-5" />
            {isLoading ? "Checking the guest list..." : "Join room"}
          </Button>

          {error ? (
            <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-center text-sm font-bold text-rose-600">
              {error}
            </p>
          ) : null}
        </form>
      </DialogContent>
    </Dialog>
  );
}
