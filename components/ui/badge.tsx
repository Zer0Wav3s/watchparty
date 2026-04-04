import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-bold tracking-[0.06em] uppercase transition-colors",
  {
    variants: {
      variant: {
        default: "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700 dark:border-fuchsia-400/20 dark:bg-fuchsia-400/10 dark:text-fuchsia-200",
        secondary: "border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-400/20 dark:bg-teal-400/10 dark:text-teal-100",
        outline: "border-slate-200 bg-white/80 text-slate-600 dark:border-white/10 dark:bg-white/8 dark:text-white/75",
        amber: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({ className, variant, ...props }: React.ComponentProps<"div"> & VariantProps<typeof badgeVariants>) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
