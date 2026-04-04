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
      <DialogContent showClose={false} className="z-30 w-[min(92vw,28rem)]">
        <DialogHeader>
          <DialogTitle>Private room</DialogTitle>
          <DialogDescription>Enter the room PIN to join the watch session.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            value={pin}
            onChange={(event) => setPin(event.target.value)}
            placeholder="Room PIN"
            className="h-11 rounded-2xl"
          />

          <Button type="submit" disabled={isLoading} className="h-11 w-full rounded-2xl">
            {isLoading ? "Checking..." : "Unlock room"}
          </Button>

          {error ? <p className="text-sm text-rose-300">{error}</p> : null}
        </form>
      </DialogContent>
    </Dialog>
  );
}
