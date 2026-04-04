import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-base font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "border border-transparent bg-[linear-gradient(135deg,#ec4899_0%,#8b5cf6_52%,#14b8a6_100%)] text-white shadow-[0_18px_40px_-20px_rgba(168,85,247,0.9)] hover:brightness-105",
        secondary:
          "border border-white/80 bg-white text-slate-800 shadow-[0_16px_32px_-24px_rgba(15,23,42,0.5)] hover:bg-pink-50",
        outline: "border border-fuchsia-200 bg-white/70 text-slate-700 hover:bg-white",
        ghost: "text-slate-600 hover:bg-white/70 hover:text-slate-900",
        destructive:
          "border border-rose-200 bg-rose-500 text-white shadow-[0_18px_40px_-20px_rgba(244,63,94,0.8)] hover:bg-rose-400",
      },
      size: {
        default: "h-12 px-6 py-2",
        sm: "h-10 rounded-xl px-4 text-sm",
        lg: "h-14 rounded-2xl px-8 text-lg",
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
