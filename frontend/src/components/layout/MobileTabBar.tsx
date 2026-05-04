import { NavLink } from "react-router-dom";
import { LayoutDashboard, ListChecks, Plus, Inbox, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/ui";

const TABS = [
  { to: "/", label: "Home", icon: LayoutDashboard, end: true },
  { to: "/expenses", label: "Expenses", icon: ListChecks },
  { to: "/inbox", label: "Inbox", icon: Inbox },
  { to: "/advisor", label: "Advisor", icon: Sparkles },
];

export function MobileTabBar() {
  const setExpenseDialogOpen = useUIStore((s) => s.setExpenseDialogOpen);
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-card/90 backdrop-blur-lg border-t pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-5 items-end gap-1 px-2 pt-2 pb-1">
        {TABS.slice(0, 2).map((t) => (
          <Tab key={t.to} {...t} />
        ))}
        <button
          type="button"
          onClick={() => setExpenseDialogOpen(true)}
          className="mx-auto -mt-6 flex h-12 w-12 items-center justify-center rounded-full gradient-bg text-white shadow-lg shadow-primary/40 active:scale-95"
          aria-label="Add expense"
        >
          <Plus className="h-5 w-5" />
        </button>
        {TABS.slice(2).map((t) => (
          <Tab key={t.to} {...t} />
        ))}
      </div>
    </nav>
  );
}

function Tab({
  to,
  label,
  icon: Icon,
  end,
}: {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  end?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          "flex flex-col items-center gap-1 rounded-md py-1.5 text-[10px] transition-colors",
          isActive ? "text-primary" : "text-muted-foreground",
        )
      }
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </NavLink>
  );
}
