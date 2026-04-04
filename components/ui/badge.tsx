import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-bold tracking-[0.06em] uppercase transition-colors",
  {
    variants: {
      variant: {
        default: "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700",
        secondary: "border-teal-200 bg-teal-50 text-teal-700",
        outline: "border-slate-200 bg-white/80 text-slate-600",
        amber: "border-amber-200 bg-amber-50 text-amber-700",
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
