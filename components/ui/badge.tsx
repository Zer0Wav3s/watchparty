import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium leading-[1.5]", {
  variants: {
    variant: {
      default: "border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)]",
      secondary: "border-transparent bg-[var(--bg)] text-[var(--text-secondary)]",
      amber: "border-transparent bg-[#FEF3C7] text-[#92400E] dark:bg-[#78350F] dark:text-[#FDE68A]",
      outline: "border-[var(--border)] bg-transparent text-[var(--text-secondary)]",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

function Badge({ className, variant, ...props }: React.ComponentProps<"div"> & VariantProps<typeof badgeVariants>) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
