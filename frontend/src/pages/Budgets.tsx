import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CategoryPill } from "@/components/common/CategoryPill";
import { EmptyState } from "@/components/common/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { CATEGORIES } from "@/types/api";
import { useBudgets, useBudgetProgress, useDeleteBudget, useUpsertBudget } from "@/hooks/useBudgets";
import { fmtMoney } from "@/lib/format";

export default function BudgetsPage() {
  const budgets = useBudgets();
  const progress = useBudgetProgress();
  const upsert = useUpsertBudget();
  const del = useDeleteBudget();

  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<string>("groceries");
  const [limit, setLimit] = useState<string>("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const numeric = parseFloat(limit);
    if (!Number.isFinite(numeric) || numeric <= 0) return;
    upsert.mutate({ category, monthly_limit: numeric, currency: "USD" });
    setOpen(false);
    setLimit("");
  }

  const progressByCategory = new Map((progress.data || []).map((p) => [p.category, p]));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Monthly budgets</CardTitle>
            <p className="text-xs text-muted-foreground">
              Per-category limits. Progress updates as expenses come in.
            </p>
          </div>
          <Button variant="gradient" size="sm" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            New budget
          </Button>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {budgets.isPending &&
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
          {budgets.data && budgets.data.length === 0 && (
            <div className="md:col-span-2 xl:col-span-3">
              <EmptyState
                title="No budgets yet"
                description="Set a monthly cap on the categories that matter most."
                action={
                  <Button variant="gradient" onClick={() => setOpen(true)}>
                    <Plus className="h-4 w-4" /> Add a budget
                  </Button>
                }
              />
            </div>
          )}
          {budgets.data?.map((b) => {
            const p = progressByCategory.get(b.category);
            const percent = p ? Math.min(100, p.percent) : 0;
            const over = p?.over_budget;
            return (
              <Card key={b.id} className="relative">
                <button
                  type="button"
                  className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:bg-secondary"
                  onClick={() => del.mutate(b.id)}
                  aria-label="Delete budget"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                <CardContent className="space-y-3 pt-5">
                  <div className="flex items-center justify-between">
                    <CategoryPill category={b.category} />
                    <Button size="icon" variant="ghost" onClick={() => del.mutate(b.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                  <div className="text-sm">
                    <span className="font-semibold tabular-nums">
                      {fmtMoney(p?.spent ?? 0, b.currency)}
                    </span>
                    <span className="text-muted-foreground"> / {fmtMoney(b.monthly_limit, b.currency)}</span>
                  </div>
                  <Progress value={percent} indicatorClassName={over ? "bg-destructive" : undefined} />
                  <div className="text-xs text-muted-foreground">
                    {over
                      ? `Over budget by ${fmtMoney((p?.spent ?? 0) - b.monthly_limit, b.currency)}`
                      : `${fmtMoney(p?.remaining ?? b.monthly_limit, b.currency)} left this month`}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New monthly budget</DialogTitle>
            <DialogDescription>
              Choose a category and how much you want to cap monthly spend at.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={submit}>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c} className="capitalize">
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="limit">Monthly limit</Label>
              <Input
                id="limit"
                type="number"
                step="1"
                min="0"
                required
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                placeholder="e.g. 400"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="gradient" disabled={upsert.isPending}>
                {upsert.isPending ? "Saving…" : "Save budget"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
