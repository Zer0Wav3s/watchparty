import { Users } from "lucide-react";

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
    <div className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)]">
      <Users className="h-4 w-4" />
      <span>{count}</span>
    </div>
  );
}
