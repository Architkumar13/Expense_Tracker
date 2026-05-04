import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { Expense, Receipt } from "@/types/api";

export function useReceipts() {
  return useQuery({
    queryKey: ["receipts"],
    queryFn: () => api<Receipt[]>("/api/receipts"),
  });
}

export function useUploadReceipt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append("file", file);
      return api<Expense>("/api/receipts/upload", { method: "POST", body: fd });
    },
    onSuccess: (expense) => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      qc.invalidateQueries({ queryKey: ["receipts"] });
      qc.invalidateQueries({ queryKey: ["budget-progress"] });
      toast.success(`Parsed receipt · ${expense.merchant || expense.description}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
