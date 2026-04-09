import { Users } from "lucide-react";

interface ViewerCountProps {
  count: number;
}

export function ViewerCount({ count }: ViewerCountProps) {
  return (
    <div className="flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-400">
      <Users className="h-4 w-4" />
      <span>{count}</span>
    </div>
  );
}
