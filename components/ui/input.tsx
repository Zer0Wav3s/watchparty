import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-10 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-base text-white shadow-xs outline-none transition placeholder:text-zinc-500 focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:border-cyan-500/50 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
