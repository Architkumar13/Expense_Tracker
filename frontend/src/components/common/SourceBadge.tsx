import { Badge } from "@/components/ui/badge";
import { FileText, Inbox, MessageSquare, PenSquare } from "lucide-react";

const MAP: Record<string, { variant: "default" | "accent" | "secondary" | "muted"; icon: React.ComponentType<{ className?: string }>; label: string }> = {
  receipt: { variant: "accent", icon: FileText, label: "Receipt" },
  mail: { variant: "default", icon: Inbox, label: "Mail" },
  message: { variant: "secondary", icon: MessageSquare, label: "SMS" },
  manual: { variant: "muted", icon: PenSquare, label: "Manual" },
};

export function SourceBadge({ source }: { source: string }) {
  const cfg = MAP[source] || MAP.manual;
  const Icon = cfg.icon;
  return (
    <Badge variant={cfg.variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {cfg.label}
    </Badge>
  );
}
