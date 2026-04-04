import * as React from "react";

import { cn } from "@/lib/utils";

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "rounded-[32px] border border-white/70 bg-white/80 shadow-[0_40px_100px_-40px_rgba(168,85,247,0.6)] ring-1 ring-white/80",
        className,
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-header" className={cn("flex flex-col gap-2 p-8 pb-0 sm:p-10", className)} {...props} />;
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-title" className={cn("text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl", className)} {...props} />;
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-description" className={cn("text-base leading-relaxed text-slate-600 sm:text-lg", className)} {...props} />;
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-content" className={cn("p-8 sm:p-10", className)} {...props} />;
}

export { Card, CardContent, CardDescription, CardHeader, CardTitle };
