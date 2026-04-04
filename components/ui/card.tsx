import * as React from "react";

import { cn } from "@/lib/utils";

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card" className={cn("rounded-[48px] bg-white/80 backdrop-blur-xl shadow-[0_20px_60px_-15px_rgba(236,72,153,0.3)] ring-2 ring-white/60", className)} {...props} />;
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-header" className={cn("flex flex-col gap-3 p-8 sm:p-12 pb-0", className)} {...props} />;
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-title" className={cn("text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-800 drop-shadow-sm", className)} {...props} />;
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-description" className={cn("text-lg sm:text-xl font-medium text-slate-500 leading-relaxed", className)} {...props} />;
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-content" className={cn("p-8 sm:p-12", className)} {...props} />;
}

export { Card, CardContent, CardDescription, CardHeader, CardTitle };
