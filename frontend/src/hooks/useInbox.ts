import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { IngestResult, MailMessage } from "@/types/api";

export function useMail() {
  return useQuery({
    queryKey: ["mail"],
    queryFn: () => api<MailMessage[]>("/api/mail"),
  });
}

export function useMessages() {
  return useQuery({
    queryKey: ["messages"],
    queryFn: () => api<MailMessage[]>("/api/messages"),
  });
}

export function useIngest(kind: "mail" | "messages") {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api<IngestResult>(`/api/${kind}/ingest`, { method: "POST" }),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      qc.invalidateQueries({ queryKey: ["budget-progress"] });
      toast.success(
        `Scanned ${result.scanned} · added ${result.created_expenses} expense${result.created_expenses === 1 ? "" : "s"}`,
      );
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
