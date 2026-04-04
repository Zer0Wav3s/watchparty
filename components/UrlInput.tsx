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
    <form className="flex flex-col gap-3 sm:flex-row" onSubmit={handleSubmit}>
      <Input
        value={url}
        onChange={(event) => setUrl(event.target.value)}
        placeholder={isHost ? "Paste a YouTube or stream URL" : "Only the host can set videos"}
        disabled={disabled || !isHost}
        className="h-12 flex-1 rounded-2xl"
      />
      <Button
        type="submit"
        variant="secondary"
        disabled={disabled || !isHost}
        className="h-12 rounded-2xl px-5"
      >
        Load video
      </Button>
    </form>
  );
}
