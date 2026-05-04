import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { Goal } from "@/types/api";

interface GoalIn {
  name: string;
  target_amount: number;
  saved_amount?: number;
  deadline?: string | null;
  currency?: string;
  notes?: string;
}

export function useGoals() {
  return useQuery({
    queryKey: ["goals"],
    queryFn: () => api<Goal[]>("/api/goals"),
  });
}

export function useCreateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: GoalIn) =>
      api<Goal>("/api/goals", { method: "POST", body: JSON.stringify(payload) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["goals"] });
      toast.success("Goal created");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useContributeGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, amount }: { id: number; amount: number }) =>
      api<Goal>(`/api/goals/${id}/contribute`, {
        method: "POST",
        body: JSON.stringify({ amount }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["goals"] });
      toast.success("Contribution recorded");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api<void>(`/api/goals/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["goals"] });
      toast.success("Goal removed");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
