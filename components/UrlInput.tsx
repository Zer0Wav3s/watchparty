"use client";

import { Link2 } from "lucide-react";
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

  const isDisabled = disabled || !isHost;

  return (
    <form
      className={`flex w-full flex-col gap-3 sm:flex-row ${isDisabled ? "opacity-50" : ""}`}
      onSubmit={handleSubmit}
    >
      <div className="relative flex-1">
        <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
        <Input
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder={
            isHost
              ? "Paste a video link..."
              : "Waiting for host to choose a video"
          }
          disabled={isDisabled}
          className="h-14 rounded-full border-slate-200 pl-10 text-center sm:text-left dark:border-slate-800"
        />
      </div>
      <Button
        type="submit"
        disabled={isDisabled}
        className="h-14 px-6 text-base"
      >
        Load
      </Button>
    </form>
  );
}
