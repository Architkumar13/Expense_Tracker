import { Search, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { useUIStore } from "@/store/ui";

interface TopbarProps {
  title: string;
  description?: string;
}

export function Topbar({ title, description }: TopbarProps) {
  const setCommandOpen = useUIStore((s) => s.setCommandOpen);
  const setExpenseDialogOpen = useUIStore((s) => s.setExpenseDialogOpen);

  return (
    <header className="sticky top-0 z-30 -mx-4 sm:-mx-6 lg:-mx-8 mb-6 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="flex items-center gap-3 px-4 sm:px-6 lg:px-8 py-4">
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-semibold leading-tight tracking-tight md:text-2xl">
            {title}
          </h1>
          {description && (
            <p className="truncate text-xs text-muted-foreground md:text-sm">{description}</p>
          )}
        </div>

        <button
          type="button"
          onClick={() => setCommandOpen(true)}
          className="hidden md:inline-flex h-9 items-center gap-2 rounded-lg border bg-background/50 px-3 text-xs text-muted-foreground hover:text-foreground transition"
          aria-label="Open command palette"
        >
          <Search className="h-3.5 w-3.5" />
          <span>Search & jump</span>
          <kbd className="ml-3 rounded border bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            ⌘K
          </kbd>
        </button>

        <Button variant="gradient" size="sm" className="hidden md:inline-flex" onClick={() => setExpenseDialogOpen(true)}>
          <Plus className="h-4 w-4" /> New
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setCommandOpen(true)}
          aria-label="Search"
        >
          <Sparkles className="h-4 w-4" />
        </Button>

        <ThemeToggle />
      </div>
    </header>
  );
}
