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
      <DialogContent showClose={false} className="z-[100] w-11/12 max-w-sm sm:max-w-md rounded-[48px] bg-white border-4 border-fuchsia-200 shadow-[0_30px_60px_-15px_rgba(217,70,239,0.4)] p-8">
        <DialogHeader className="space-y-6 flex flex-col items-center">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[32px] bg-gradient-to-br from-fuchsia-100 to-pink-100 shadow-inner">
            <span className="text-4xl translate-y-1">🪄</span>
          </div>
          <div className="space-y-2 text-center">
            <DialogTitle className="text-3xl font-black text-slate-800">VIP Access Only</DialogTitle>
            <DialogDescription className="text-lg font-medium text-slate-500">
              Got the secret word? Enter the PIN below.
            </DialogDescription>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="relative group">
            <Input
              value={pin}
              onChange={(event) => setPin(event.target.value)}
              placeholder="Secret PIN"
              type="password"
              className="h-16 w-full rounded-3xl bg-slate-50 border-2 border-slate-200 text-center text-2xl tracking-widest text-slate-800 outline-none transition-all placeholder:text-slate-300 focus:border-fuchsia-400 font-black shadow-inner"
            />
          </div>

          <Button type="submit" disabled={isLoading} size="lg" className="w-full h-16 rounded-3xl text-lg font-black tracking-wide border-none bg-gradient-to-r from-fuchsia-500 to-pink-500 hover:from-fuchsia-400 hover:to-pink-400 text-white shadow-xl shadow-fuchsia-500/30 transition-transform active:scale-95">
            {isLoading ? "Checking list..." : "Let me in 🚀"}
          </Button>

          {error ? (
            <p className="animate-bounce text-center text-sm font-bold text-rose-500 bg-rose-50 border border-rose-200 rounded-xl py-3 px-4">
              Oops! {error} Try again.
            </p>
          ) : null}
        </form>
      </DialogContent>
    </Dialog>
  );
}
