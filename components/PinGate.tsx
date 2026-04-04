"use client";

import { useState } from "react";

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
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/80 px-6 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-3xl border border-white/10 bg-slate-950/95 p-6 shadow-2xl shadow-black/50"
      >
        <h2 className="text-xl font-semibold text-white">Private room</h2>
        <p className="mt-2 text-sm text-zinc-300">Enter the room PIN to join the watch session.</p>

        <input
          value={pin}
          onChange={(event) => setPin(event.target.value)}
          placeholder="Room PIN"
          className="mt-5 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-cyan-400/60"
        />

        <button
          type="submit"
          disabled={isLoading}
          className="mt-4 flex h-11 w-full items-center justify-center rounded-2xl bg-cyan-400 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-cyan-400/60"
        >
          {isLoading ? "Checking..." : "Unlock room"}
        </button>

        {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
      </form>
    </div>
  );
}
