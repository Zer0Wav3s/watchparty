import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-3 whitespace-nowrap rounded-[24px] text-lg font-black transition-all disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-4 focus-visible:ring-fuchsia-300 focus-visible:ring-offset-2 focus-visible:ring-offset-pink-50 active:scale-95 duration-200",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white hover:from-fuchsia-400 hover:to-pink-400 shadow-xl shadow-fuchsia-500/30",
        secondary: "bg-white text-fuchsia-600 border-2 border-fuchsia-100 hover:bg-fuchsia-50 hover:border-fuchsia-200 shadow-md",
        outline: "border-3 border-pink-200 bg-transparent text-pink-600 hover:bg-pink-50",
        ghost: "text-slate-500 hover:bg-pink-100/50 hover:text-pink-600",
        destructive: "bg-gradient-to-r from-rose-500 to-orange-500 text-white hover:from-rose-400 hover:to-orange-400 shadow-xl shadow-rose-500/30",
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
