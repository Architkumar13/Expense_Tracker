import { Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { MobileTabBar } from "./MobileTabBar";
import { CommandPalette } from "@/components/common/CommandPalette";
import { ExpenseFormDialog } from "@/components/expenses/ExpenseFormDialog";
import { useUIStore } from "@/store/ui";

const TITLES: Record<string, [string, string]> = {
  "/": ["Dashboard", "A snapshot of your money — totals, trends and budgets."],
  "/expenses": ["Expenses", "Search, filter, edit and export your transactions."],
  "/receipts": ["Receipts", "Upload PDFs and let Claude do the bookkeeping."],
  "/inbox": ["Inbox", "Pull transactional mail and SMS into expenses."],
  "/budgets": ["Budgets", "Per-category monthly limits with live progress."],
  "/subscriptions": ["Subscriptions", "Recurring charges detected from your history."],
  "/goals": ["Goals", "Save with intent — track progress toward what matters."],
  "/advisor": ["AI Advisor", "Personal finance coach with live ticker context."],
  "/settings": ["Settings", "Theme, integrations and data hygiene."],
};

export function AppShell() {
  const { pathname } = useLocation();
  const [title, description] =
    TITLES[pathname] ||
    ["AI Expense Tracker", "Built with FastAPI + React + Tailwind"];

  const toggleCommand = useUIStore((s) => s.toggleCommand);
  const setExpenseDialogOpen = useUIStore((s) => s.setExpenseDialogOpen);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const isField =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        toggleCommand();
      } else if (!isField && e.key.toLowerCase() === "n" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setExpenseDialogOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleCommand, setExpenseDialogOpen]);

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <Sidebar />
      <main className="relative min-w-0 flex-1 px-4 sm:px-6 lg:px-8 pb-24 md:pb-12">
        <Topbar title={title} description={description} />
        <div className="mx-auto max-w-7xl">
          <Outlet />
        </div>
      </main>
      <MobileTabBar />
      <CommandPalette />
      <ExpenseFormDialog />
    </div>
  );
}
