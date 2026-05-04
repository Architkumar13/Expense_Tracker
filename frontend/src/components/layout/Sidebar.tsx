import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ListChecks,
  Upload,
  Inbox,
  PiggyBank,
  Repeat,
  Target,
  Sparkles,
  Settings,
  WandSparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useHealth } from "@/hooks/useHealth";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/expenses", label: "Expenses", icon: ListChecks },
  { to: "/receipts", label: "Receipts", icon: Upload },
  { to: "/inbox", label: "Inbox", icon: Inbox },
  { to: "/budgets", label: "Budgets", icon: PiggyBank },
  { to: "/subscriptions", label: "Subscriptions", icon: Repeat },
  { to: "/goals", label: "Goals", icon: Target },
  { to: "/advisor", label: "Advisor", icon: Sparkles },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const { data: health } = useHealth();
  const flags: { label: string; ok: boolean }[] = health
    ? [
        { label: "AI", ok: health.ai_enabled },
        { label: "MCP·mail", ok: health.mcp_mail },
        { label: "MCP·msg", ok: health.mcp_messages },
        { label: "IMAP", ok: health.imap_configured },
      ]
    : [];

  return (
    <aside className="hidden md:flex sticky top-0 h-screen w-64 shrink-0 flex-col gap-4 border-r bg-card/50 backdrop-blur-md p-4">
      <div className="flex items-center gap-3 px-2">
        <div className="grid h-10 w-10 place-items-center rounded-xl gradient-bg shadow-lg shadow-primary/30">
          <WandSparkles className="h-5 w-5 text-white" />
        </div>
        <div>
          <div className="text-sm font-semibold leading-tight">Expense Tracker</div>
          <div className="text-[11px] text-muted-foreground">AI · MCP · FastAPI</div>
        </div>
      </div>

      <nav className="flex flex-col gap-1">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                isActive
                  ? "bg-primary/10 text-foreground border border-primary/20 shadow-sm shadow-primary/10"
                  : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
              )
            }
          >
            <item.icon className="h-4 w-4" />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto rounded-lg border bg-background/40 p-3 text-xs">
        <div className="mb-2 text-muted-foreground">Integrations</div>
        <div className="flex flex-wrap gap-1.5">
          {flags.map((f) => (
            <span
              key={f.label}
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-medium",
                f.ok ? "bg-success/15 text-success" : "bg-muted text-muted-foreground",
              )}
            >
              {f.label} {f.ok ? "✓" : "—"}
            </span>
          ))}
        </div>
      </div>
    </aside>
  );
}
