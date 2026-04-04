import * as React from "react";

import { cn } from "@/lib/utils";

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card" className={cn("rounded-[32px] border border-white/5 bg-[#0a0a0c] shadow-2xl shadow-black/80 ring-1 ring-white/10 inset-ring inset-ring-white/5", className)} {...props} />;
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-header" className={cn("flex flex-col gap-2 p-8 sm:p-10 pb-0", className)} {...props} />;
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-title" className={cn("text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white", className)} {...props} />;
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-description" className={cn("text-base sm:text-lg text-zinc-400 leading-relaxed", className)} {...props} />;
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-content" className={cn("p-8 sm:p-10", className)} {...props} />;
}

export { Card, CardContent, CardDescription, CardHeader, CardTitle };
