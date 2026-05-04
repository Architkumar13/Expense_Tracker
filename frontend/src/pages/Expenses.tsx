import { useMemo, useState } from "react";
import { Download, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ExpenseFilters } from "@/components/expenses/ExpenseFilters";
import { ExpenseTable } from "@/components/expenses/ExpenseTable";
import { EmptyState } from "@/components/common/EmptyState";
import { useExpenses, type ExpenseFilters as Filters } from "@/hooks/useExpenses";
import { buildQuery } from "@/lib/api";
import { fmtMoney } from "@/lib/format";
import { useUIStore } from "@/store/ui";

export default function ExpensesPage() {
  const [filters, setFilters] = useState<Filters>({ limit: 50 });
  const setExpenseDialogOpen = useUIStore((s) => s.setExpenseDialogOpen);
  const list = useExpenses(filters);

  const subtotal = useMemo(() => {
    if (!list.data?.items) return 0;
    return list.data.items.reduce((sum, e) => sum + (e.amount > 0 ? e.amount : 0), 0);
  }, [list.data]);

  const exportHref = `/api/expenses/export.csv${buildQuery({
    q: filters.q,
    category: filters.category,
    source: filters.source,
    start: filters.start,
    end: filters.end,
    min_amount: filters.min_amount,
    max_amount: filters.max_amount,
  })}`;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold">All transactions</h2>
              <p className="text-xs text-muted-foreground">
                {list.data
                  ? `${list.data.total} total · current view ${fmtMoney(subtotal)}`
                  : "Loading…"}
              </p>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm">
                <a href={exportHref} download>
                  <Download className="h-4 w-4" />
                  Export CSV
                </a>
              </Button>
              <Button variant="gradient" size="sm" onClick={() => setExpenseDialogOpen(true)}>
                <Plus className="h-4 w-4" />
                New expense
              </Button>
            </div>
          </div>
          <ExpenseFilters value={filters} onChange={setFilters} />
        </CardHeader>
        <CardContent className="px-2 pt-0">
          {list.isPending && (
            <div className="space-y-2 p-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          )}
          {list.isError && (
            <EmptyState
              title="Couldn't load expenses"
              description={(list.error as Error).message}
            />
          )}
          {list.data && (
            <ExpenseTable
              data={list.data.items}
              emptyAction={
                <Button variant="gradient" onClick={() => setExpenseDialogOpen(true)}>
                  Add your first expense
                </Button>
              }
            />
          )}
          {list.data?.next_cursor && (
            <div className="flex justify-center py-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters({ ...filters, cursor: list.data!.next_cursor! })}
              >
                Load more
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
