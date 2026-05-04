import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, buildQuery } from "@/lib/api";
import type { Expense, ExpenseCreate, ExpensePage, ExpenseUpdate } from "@/types/api";

export interface ExpenseFilters {
  [key: string]: string | number | boolean | null | undefined;
  q?: string;
  category?: string;
  source?: string;
  start?: string;
  end?: string;
  min_amount?: number;
  max_amount?: number;
  cursor?: number;
  limit?: number;
}

export function expenseQueryKey(filters: ExpenseFilters = {}) {
  return ["expenses", filters] as const;
}

export function useExpenses(filters: ExpenseFilters = {}) {
  return useQuery({
    queryKey: expenseQueryKey(filters),
    queryFn: () => api<ExpensePage>(`/api/expenses${buildQuery(filters)}`),
  });
}

export function useCreateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ExpenseCreate) =>
      api<Expense>("/api/expenses", { method: "POST", body: JSON.stringify(payload) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      qc.invalidateQueries({ queryKey: ["budget-progress"] });
      toast.success("Expense added");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: number; patch: ExpenseUpdate }) =>
      api<Expense>(`/api/expenses/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      qc.invalidateQueries({ queryKey: ["budget-progress"] });
      toast.success("Expense updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api<void>(`/api/expenses/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      qc.invalidateQueries({ queryKey: ["budget-progress"] });
      toast.success("Expense deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
