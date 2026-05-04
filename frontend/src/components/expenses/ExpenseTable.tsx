import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { CategoryPill } from "@/components/common/CategoryPill";
import { SourceBadge } from "@/components/common/SourceBadge";
import { ExpenseFormDialog } from "./ExpenseFormDialog";
import { fmtDate, fmtMoney } from "@/lib/format";
import type { Expense } from "@/types/api";
import { useDeleteExpense } from "@/hooks/useExpenses";

interface Props {
  data: Expense[] | undefined;
  loading?: boolean;
  emptyAction?: React.ReactNode;
  compact?: boolean;
}

export function ExpenseTable({ data, loading, emptyAction, compact }: Props) {
  const [editing, setEditing] = useState<Expense | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const del = useDeleteExpense();

  if (loading) {
    return (
      <div className="space-y-2 p-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="px-6 py-10 text-center">
        <p className="text-sm text-muted-foreground">No expenses match your filters.</p>
        {emptyAction && <div className="mt-3">{emptyAction}</div>}
      </div>
    );
  }

  return (
    <>
      {/* Mobile cards */}
      <ul className="space-y-2 md:hidden">
        {data.map((e) => (
          <li
            key={e.id}
            className="rounded-xl border bg-card p-3 shadow-sm"
            onClick={() => {
              setEditing(e);
              setEditOpen(true);
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{e.description}</div>
                <div className="text-xs text-muted-foreground">
                  {fmtDate(e.occurred_at)} · {e.merchant || "—"}
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold tabular-nums">{fmtMoney(e.amount, e.currency)}</div>
                <SourceBadge source={e.source} />
              </div>
            </div>
            <div className="mt-2">
              <CategoryPill category={e.category} />
            </div>
          </li>
        ))}
      </ul>

      {/* Desktop table */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Merchant</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Source</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              {!compact && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((e) => (
              <TableRow key={e.id} className="group cursor-pointer">
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {fmtDate(e.occurred_at)}
                </TableCell>
                <TableCell className="font-medium">{e.description}</TableCell>
                <TableCell className="text-muted-foreground">{e.merchant || "—"}</TableCell>
                <TableCell>
                  <CategoryPill category={e.category} />
                </TableCell>
                <TableCell>
                  <SourceBadge source={e.source} />
                </TableCell>
                <TableCell className="text-right font-semibold tabular-nums">
                  {fmtMoney(e.amount, e.currency)}
                </TableCell>
                {!compact && (
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setEditing(e);
                          setEditOpen(true);
                        }}
                        aria-label="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => del.mutate(e.id)}
                        aria-label="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ExpenseFormDialog
        expense={editing}
        open={editOpen}
        onOpenChange={(o) => {
          setEditOpen(o);
          if (!o) setEditing(null);
        }}
      />
    </>
  );
}
