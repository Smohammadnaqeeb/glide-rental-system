import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const tone: Record<string, string> = {
  available: "bg-success/15 text-success border-success/30",
  returned: "bg-success/15 text-success border-success/30",
  completed: "bg-success/15 text-success border-success/30",
  paid: "bg-success/15 text-success border-success/30",
  confirmed: "bg-chart-2/15 text-chart-2 border-chart-2/30",
  active: "bg-primary/15 text-primary border-primary/30",
  rented: "bg-primary/15 text-primary border-primary/30",
  pending: "bg-warning/15 text-warning border-warning/30",
  maintenance: "bg-warning/15 text-warning border-warning/30",
  late: "bg-destructive/15 text-destructive border-destructive/30",
  cancelled: "bg-destructive/15 text-destructive border-destructive/30",
  rejected: "bg-destructive/15 text-destructive border-destructive/30",
  failed: "bg-destructive/15 text-destructive border-destructive/30",
  refunded: "bg-muted text-muted-foreground border-border",
  inactive: "bg-muted text-muted-foreground border-border",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn("capitalize", tone[status] ?? "bg-muted text-muted-foreground", className)}
    >
      {status}
    </Badge>
  );
}
