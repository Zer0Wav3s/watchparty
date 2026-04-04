import { Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ViewerCountProps {
  count: number;
}

const avatarColors = [
  "from-fuchsia-500 to-pink-400",
  "from-violet-500 to-indigo-400",
  "from-teal-500 to-emerald-400",
  "from-amber-400 to-orange-400",
] as const;

export function ViewerCount({ count }: ViewerCountProps) {
  const visibleViewers = Math.max(count, 1);
  const avatars = Array.from({ length: Math.min(visibleViewers, 4) }, (_, index) => index + 1);

  return (
    <Badge variant="secondary" className="gap-3 rounded-full px-3 py-2 text-sm normal-case tracking-normal dark:border-white/10 dark:bg-white/6 dark:text-white/85">
      <div className="flex -space-x-2">
        {avatars.map((avatar, index) => (
          <div
            key={avatar}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-[11px] font-black text-white shadow-sm dark:border-slate-950",
              `bg-gradient-to-br ${avatarColors[index % avatarColors.length]}`,
            )}
          >
            {avatar}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4" />
        <span>
          {count} viewer{count === 1 ? "" : "s"}
        </span>
      </div>
    </Badge>
  );
}
