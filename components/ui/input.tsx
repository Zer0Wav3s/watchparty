import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-10 w-full rounded-[28px] border border-fuchsia-200 bg-white px-4 py-2 text-base text-slate-800 shadow-[0_16px_32px_-28px_rgba(168,85,247,0.8)] outline-none transition placeholder:text-slate-400 focus-visible:border-fuchsia-400 focus-visible:ring-4 focus-visible:ring-fuchsia-200/70 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-slate-950/60 dark:text-white dark:placeholder:text-white/35",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
