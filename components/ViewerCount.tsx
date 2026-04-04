import { Badge } from "@/components/ui/badge";

interface ViewerCountProps {
  count: number;
}

export function ViewerCount({ count }: ViewerCountProps) {
  return <Badge variant="secondary">{count} viewer{count === 1 ? "" : "s"}</Badge>;
}
