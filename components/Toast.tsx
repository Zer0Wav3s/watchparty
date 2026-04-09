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
            animate={{ opacity: 1, y: 16 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="rounded-full bg-slate-900 px-4 py-2 text-sm text-white shadow-xl dark:bg-slate-50 dark:text-slate-950"
          >
            {toast.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
