import { Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";

interface ViewerCountProps {
  count: number;
}

export function ViewerCount({ count }: ViewerCountProps) {
  return (
    <Badge variant="secondary" className="gap-2 px-4 py-2 text-sm normal-case tracking-normal">
      <Users className="h-4 w-4" />
      {count} viewer{count === 1 ? "" : "s"}
    </Badge>
  );
}
