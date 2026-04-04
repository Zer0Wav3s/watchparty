"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";

import { useTheme } from "@/app/providers";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="h-10 w-10 rounded-full border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)]"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={isDark ? "moon" : "sun"}
          initial={{ rotate: 0 }}
          animate={{ rotate: 0 }}
          exit={{ rotate: 180 }}
          transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
          className="flex items-center justify-center"
        >
          {isDark ? (
            <Moon className="h-5 w-5 text-[var(--text-primary)]" />
          ) : (
            <Sun className="h-5 w-5 text-[var(--text-primary)]" />
          )}
        </motion.span>
      </AnimatePresence>
    </Button>
  );
}
