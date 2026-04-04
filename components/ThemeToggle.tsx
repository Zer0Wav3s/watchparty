"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative h-12 w-12 overflow-hidden rounded-full border-white/75 bg-white/72 shadow-[0_24px_60px_-30px_rgba(168,85,247,0.9)] backdrop-blur-xl hover:scale-105 hover:shadow-[0_30px_80px_-34px_rgba(168,85,247,1)] dark:border-white/10 dark:bg-slate-950/65"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <span className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.85),transparent_62%)] opacity-70 dark:bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.18),transparent_62%)]" />
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={isDark ? "moon" : "sun"}
          initial={{ opacity: 0, rotate: -22, scale: 0.72, y: 4 }}
          animate={{ opacity: 1, rotate: 0, scale: 1, y: 0 }}
          exit={{ opacity: 0, rotate: 22, scale: 0.72, y: -4 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative z-10"
        >
          {isDark ? <Moon className="h-5 w-5 text-cyan-300" /> : <Sun className="h-5 w-5 text-fuchsia-600" />}
        </motion.span>
      </AnimatePresence>
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
