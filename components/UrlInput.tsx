"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
    <form className="flex w-full flex-col gap-4 sm:flex-row" onSubmit={handleSubmit}>
      <div className="relative flex-1 group focus-within:z-10">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-6">
          <span className="text-xl grayscale group-focus-within:grayscale-0 transition-all">🔗</span>
        </div>
        <Input
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder={isHost ? "Paste YouTube or HLS link..." : "Waiting for party host to pick a video..."}
          disabled={disabled || !isHost}
          className="h-16 w-full rounded-[32px] bg-white border-2 border-fuchsia-100 pl-16 text-lg transition-all hover:bg-fuchsia-50 focus:bg-white"
        />
      </div>
      <Button
        type="submit"
        variant="default"
        disabled={disabled || !isHost}
        className="h-16 w-full rounded-[32px] px-10 text-xl font-black sm:w-auto shadow-xl shadow-pink-500/20 transition-transform active:scale-95 border-none"
      >
        Play 🎉
      </Button>
    </form>
  );
}
