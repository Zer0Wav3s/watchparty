import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium cursor-pointer outline-none transition-[background,color,border-color,box-shadow,opacity,transform] duration-200 disabled:pointer-events-none disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]",
  {
    variants: {
      variant: {
        default:
          "border border-transparent bg-[var(--accent-primary)] text-white shadow-none hover:bg-[var(--accent-primary-hover)]",
        outline: "border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] hover:bg-[var(--surface-hover)]",
        ghost: "border border-transparent bg-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]",
        destructive: "border border-transparent bg-[var(--danger)] text-white hover:bg-[var(--danger-hover)]",
      },
      size: {
        default: "h-12 px-4 py-2 text-base",
        sm: "h-8 rounded-[8px] px-3 text-sm",
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
