import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  AVAILABLE: "bg-primary/10 text-primary border-primary/20",
  BOOKED: "bg-accent text-accent-foreground border-border",
  COMPLETED: "bg-success/15 text-success border-success/25",
  CANCELLED: "bg-destructive/12 text-destructive border-destructive/25",
  EXPIRED: "bg-muted text-muted-foreground border-border",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide", styles[status], className)}
    >
      {status}
    </Badge>
  );
}
