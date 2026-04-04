import { Users } from "lucide-react";

interface ViewerCountProps {
  count: number;
}

export function ViewerCount({ count }: ViewerCountProps) {
  return (
    <div className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)]">
      <Users className="h-4 w-4" />
      <span>{count}</span>
    </div>
  );
}
