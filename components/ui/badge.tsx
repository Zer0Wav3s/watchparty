import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-4 py-2 text-xs font-black tracking-widest uppercase transition-all shadow-sm",
  {
    variants: {
      variant: {
        default: "border-2 border-fuchsia-200 bg-gradient-to-r from-fuchsia-100 to-pink-100 text-fuchsia-700",
        secondary: "border-2 border-indigo-200 bg-gradient-to-r from-indigo-100 to-violet-100 text-indigo-700",
        outline: "border-2 border-slate-200 bg-white/50 text-slate-500",
        amber: "border-2 border-amber-200 bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 drop-shadow-sm",
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
