import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { Budget, BudgetProgress } from "@/types/api";

export function useBudgets() {
  return useQuery({
    queryKey: ["budgets"],
    queryFn: () => api<Budget[]>("/api/budgets"),
  });
}

export function useBudgetProgress() {
  return useQuery({
    queryKey: ["budget-progress"],
    queryFn: () => api<BudgetProgress[]>("/api/budgets/progress"),
  });
}

interface BudgetIn {
  category: string;
  monthly_limit: number;
  currency?: string;
}

export function useUpsertBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: BudgetIn) =>
      api<Budget>("/api/budgets", { method: "POST", body: JSON.stringify(payload) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["budgets"] });
      qc.invalidateQueries({ queryKey: ["budget-progress"] });
      toast.success("Budget saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api<void>(`/api/budgets/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["budgets"] });
      qc.invalidateQueries({ queryKey: ["budget-progress"] });
      toast.success("Budget removed");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
