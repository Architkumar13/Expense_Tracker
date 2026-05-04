import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
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
  Plus,
  Sun,
  Moon,
  Monitor,
  RefreshCw,
} from "lucide-react";
import { useUIStore } from "@/store/ui";
import { useThemeStore } from "@/store/theme";
import { useIngest } from "@/hooks/useInbox";
import { queryClient } from "@/lib/queryClient";

const PAGES = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/expenses", label: "Expenses", icon: ListChecks },
  { to: "/receipts", label: "Receipts", icon: Upload },
  { to: "/inbox", label: "Inbox", icon: Inbox },
  { to: "/budgets", label: "Budgets", icon: PiggyBank },
  { to: "/subscriptions", label: "Subscriptions", icon: Repeat },
  { to: "/goals", label: "Goals", icon: Target },
  { to: "/advisor", label: "Advisor", icon: Sparkles },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function CommandPalette() {
  const open = useUIStore((s) => s.commandOpen);
  const setOpen = useUIStore((s) => s.setCommandOpen);
  const setExpenseDialogOpen = useUIStore((s) => s.setExpenseDialogOpen);
  const setTheme = useThemeStore((s) => s.setTheme);
  const ingestMail = useIngest("mail");
  const ingestMessages = useIngest("messages");
  const navigate = useNavigate();

  function run(action: () => void) {
    setOpen(false);
    action();
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search pages, actions and integrations…" />
      <CommandList>
        <CommandEmpty>Nothing matches.</CommandEmpty>
        <CommandGroup heading="Navigate">
          {PAGES.map((p) => (
            <CommandItem key={p.to} onSelect={() => run(() => navigate(p.to))}>
              <p.icon className="h-4 w-4 text-muted-foreground" />
              {p.label}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => run(() => setExpenseDialogOpen(true))}>
            <Plus className="h-4 w-4 text-muted-foreground" />
            New expense
            <CommandShortcut>N</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => run(() => navigate("/receipts"))}>
            <Upload className="h-4 w-4 text-muted-foreground" />
            Upload receipt
          </CommandItem>
          <CommandItem onSelect={() => run(() => ingestMail.mutate())}>
            <Inbox className="h-4 w-4 text-muted-foreground" />
            Ingest mail as expenses
          </CommandItem>
          <CommandItem onSelect={() => run(() => ingestMessages.mutate())}>
            <Inbox className="h-4 w-4 text-muted-foreground" />
            Ingest messages as expenses
          </CommandItem>
          <CommandItem onSelect={() => run(() => queryClient.invalidateQueries())}>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
            Refresh data
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Theme">
          <CommandItem onSelect={() => run(() => setTheme("light"))}>
            <Sun className="h-4 w-4 text-muted-foreground" /> Light
          </CommandItem>
          <CommandItem onSelect={() => run(() => setTheme("dark"))}>
            <Moon className="h-4 w-4 text-muted-foreground" /> Dark
          </CommandItem>
          <CommandItem onSelect={() => run(() => setTheme("system"))}>
            <Monitor className="h-4 w-4 text-muted-foreground" /> System
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
