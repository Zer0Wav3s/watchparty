"use client";

import { AnimatePresence, motion } from "framer-motion";

interface ToastMessage {
  id: number;
  message: string;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
}

export type { ToastMessage };

export function ToastContainer({ toasts }: ToastContainerProps) {
  return (
    <div className="fixed top-4 left-1/2 z-[80] flex -translate-x-1/2 flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text-primary)] shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
          >
            {toast.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
