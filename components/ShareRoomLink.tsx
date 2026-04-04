"use client";

import { motion } from "framer-motion";
import { CheckCircle, Copy } from "lucide-react";
import { useCallback, useRef, useState } from "react";

interface ShareRoomLinkProps {
  roomId: string;
}

export function ShareRoomLink({ roomId }: ShareRoomLinkProps) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const roomUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/room/${roomId}`
      : `/room/${roomId}`;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(roomUrl);
      setCopied(true);

      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = window.setTimeout(() => {
        setCopied(false);
        timeoutRef.current = null;
      }, 3000);
    } catch {
      // Clipboard API not available
    }
  }, [roomUrl]);

  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-4 sm:flex-row sm:gap-3">
      <span className="text-sm font-medium text-[var(--text-muted)]">
        Share Room:
      </span>
      <motion.button
        type="button"
        onClick={handleCopy}
        whileTap={{ scale: 0.95 }}
        className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2 transition-colors duration-200 ease-out hover:border-[var(--accent-primary)]"
      >
        <span className="max-w-[250px] truncate font-mono text-sm text-[var(--text-secondary)] sm:max-w-md">
          {roomUrl}
        </span>
        {copied ? (
          <CheckCircle className="h-4 w-4 shrink-0 text-[var(--success)]" />
        ) : (
          <Copy className="h-4 w-4 shrink-0 text-[var(--text-muted)] transition-colors duration-200 ease-out group-hover:text-[var(--accent-primary)]" />
        )}
      </motion.button>

      {/* Copied toast */}
      {copied ? (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{
            duration: 0.3,
            ease: [0.175, 0.885, 0.32, 1.275],
          }}
          className="fixed bottom-6 right-6 z-[80] flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text-primary)] shadow-lg"
        >
          <CheckCircle className="h-4 w-4 text-[var(--success)]" />
          Copied to clipboard!
        </motion.div>
      ) : null}
    </div>
  );
}
