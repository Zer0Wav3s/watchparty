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
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
          <svg className="h-5 w-5 text-zinc-500 transition-colors group-focus-within:text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </div>
        <Input
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder={isHost ? "Enter YouTube, HLS, or direct video URL" : "Waiting for admin to set playback source"}
          disabled={disabled || !isHost}
          className="h-14 w-full rounded-[20px] bg-white/5 pl-12 text-base transition-all hover:bg-white/10"
        />
      </div>
      <Button
        type="submit"
        variant="secondary"
        disabled={disabled || !isHost}
        className="h-14 w-full rounded-[20px] px-8 text-base font-bold sm:w-auto shadow-lg shadow-white/5"
      >
        Load Stream
      </Button>
    </form>
  );
}
