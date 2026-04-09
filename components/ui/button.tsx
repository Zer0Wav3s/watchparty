import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold cursor-pointer outline-none transition-[background,color,border-color,box-shadow,opacity,transform] duration-200 ease-out hover:scale-[1.02] disabled:pointer-events-none disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]",
  {
    variants: {
      variant: {
        default:
          "border border-transparent bg-slate-950 text-white shadow-none hover:-translate-y-px hover:bg-[var(--accent-primary-hover)] hover:shadow-[0_4px_14px_0_rgba(139,92,246,0.39)] dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100",
        outline: "border border-slate-200 bg-white text-slate-900 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-50 dark:hover:bg-slate-800",
        ghost: "border border-transparent bg-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]",
        destructive: "border border-transparent bg-red-500 text-white hover:bg-red-600 dark:bg-red-500 dark:text-white dark:hover:bg-red-600",
      },
      size: {
        default: "h-12 px-4 py-2 text-base",
        sm: "h-8 px-3 text-sm",
        lg: "h-12 px-6 py-2 text-base",
        icon: "h-10 w-10 rounded-full",
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
