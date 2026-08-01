import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: "primary" | "success" | "warning" | "destructive";
  hint?: string;
  loading?: boolean;
}

const tones = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/15 text-success",
  warning: "bg-warning/20 text-warning",
  destructive: "bg-destructive/12 text-destructive",
} as const;

export function StatCard({ label, value, icon: Icon, tone = "primary", hint, loading }: StatCardProps) {
  return (
    <Card className="card-surface animate-fade-up border-0 transition-shadow hover:shadow-[var(--shadow-lift)]">
      <CardContent className="flex items-start gap-4 p-5">
        <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", tones[tone])}>
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          {loading ? (
            <Skeleton className="mt-2 h-7 w-14" />
          ) : (
            <p className="font-display text-2xl font-semibold">{value}</p>
          )}
          {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}
