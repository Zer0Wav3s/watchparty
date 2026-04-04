"use client";

import { Link2, Play } from "lucide-react";
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
      <div className="relative flex-1">
        <Link2 className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-fuchsia-400 dark:text-cyan-400" />
        <Input
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder={isHost ? "Paste a YouTube, HLS, or direct video link" : "Waiting for the host to choose a video"}
          disabled={disabled || !isHost}
          className="h-16 rounded-[28px] border-fuchsia-200 dark:border-zinc-800 bg-white dark:bg-black/50 pl-14 pr-5 text-base text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus-visible:ring-fuchsia-400 dark:focus-visible:ring-cyan-400 focus-visible:border-transparent"
        />
      </div>
      <Button
        type="submit"
        disabled={disabled || !isHost}
        size="lg"
        className="h-16 rounded-[28px] px-8 text-base font-black sm:w-auto"
      >
        <Play className="h-5 w-5 fill-current" />
        Load stream
      </Button>
    </form>
  );
}
