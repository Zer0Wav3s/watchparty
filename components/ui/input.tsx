import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-14 w-full rounded-full border-2 border-slate-200 bg-white/80 px-6 py-3 text-lg font-medium text-slate-800 shadow-sm outline-none transition-all placeholder:text-slate-400 focus-visible:border-fuchsia-400 focus-visible:ring-4 focus-visible:ring-fuchsia-200/50 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
