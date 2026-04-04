"use client";

import { useState } from "react";

interface UrlInputProps {
  disabled?: boolean;
  isHost: boolean;
  onSubmit: (url: string) => Promise<void> | void;
}

export function UrlInput({ disabled, isHost, onSubmit }: UrlInputProps) {
  const [url, setUrl] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!url.trim()) {
      return;
    }

    await onSubmit(url.trim());
    setUrl("");
  }

  return (
    <form className="flex flex-col gap-3 sm:flex-row" onSubmit={handleSubmit}>
      <input
        value={url}
        onChange={(event) => setUrl(event.target.value)}
        placeholder={isHost ? "Paste a YouTube or stream URL" : "Only the host can set videos"}
        disabled={disabled || !isHost}
        className="h-12 flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 text-white outline-none transition placeholder:text-zinc-500 focus:border-cyan-400/60 disabled:cursor-not-allowed disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={disabled || !isHost}
        className="h-12 rounded-2xl bg-white px-5 font-semibold text-slate-950 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:bg-white/30 disabled:text-white/70"
      >
        Load video
      </button>
    </form>
  );
}
