import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-base font-medium transition-all disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
  {
    variants: {
      variant: {
        default: "bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-lg shadow-cyan-500/20 active:scale-[0.98]",
        secondary: "bg-white text-slate-950 hover:bg-zinc-200 active:scale-[0.98]",
        outline: "border border-white/10 bg-white/5 text-white hover:bg-white/10 active:scale-[0.98]",
        ghost: "text-zinc-300 hover:bg-white/10 hover:text-white active:scale-[0.98]",
        destructive: "bg-rose-500 text-white hover:bg-rose-400 shadow-lg shadow-rose-500/20 active:scale-[0.98]",
      },
      size: {
        default: "h-12 px-6 py-2",
        sm: "h-10 rounded-xl px-4 text-sm",
        lg: "h-14 lg:h-16 rounded-2xl px-10 text-lg",
        icon: "h-12 w-12 rounded-2xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants>) {
  return <button data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };
