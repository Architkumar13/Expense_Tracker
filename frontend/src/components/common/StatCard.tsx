import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  icon?: React.ReactNode;
  accent?: "primary" | "accent" | "success" | "destructive" | "muted";
  loading?: boolean;
}

const ACCENTS: Record<NonNullable<StatCardProps["accent"]>, string> = {
  primary: "from-primary/30 to-primary/0 text-primary",
  accent: "from-accent/30 to-accent/0 text-accent",
  success: "from-success/25 to-success/0 text-success",
  destructive: "from-destructive/25 to-destructive/0 text-destructive",
  muted: "from-muted to-muted/0 text-muted-foreground",
};

export function StatCard({ label, value, hint, icon, accent = "primary", loading }: StatCardProps) {
  return (
    <Card className="relative overflow-hidden">
      <div
        className={cn(
          "pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full blur-2xl opacity-50",
          "bg-gradient-to-br",
          ACCENTS[accent],
        )}
      />
      <CardContent className="relative pt-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          {icon && <div className={cn("text-muted-foreground", `text-${accent}`)}>{icon}</div>}
        </div>
        <div className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
          {loading ? <span className="inline-block h-8 w-32 skeleton rounded-md" /> : value}
        </div>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}
