import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, buildQuery } from "@/lib/api";
import type { AdvisorReply, ChatTurn, StockQuote } from "@/types/api";

export function useChatHistory() {
  return useQuery({
    queryKey: ["chat-history"],
    queryFn: () => api<ChatTurn[]>("/api/advisor/history"),
  });
}

export function useSendChat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (message: string) =>
      api<AdvisorReply>("/api/advisor/chat", {
        method: "POST",
        body: JSON.stringify({ message }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chat-history"] }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useClearChat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api<void>("/api/advisor/history", { method: "DELETE" }),
    onSuccess: () => {
      qc.setQueryData(["chat-history"], [] as ChatTurn[]);
      toast.success("Chat cleared");
    },
  });
}

export function useQuotes(symbols: string[]) {
  const list = symbols.filter(Boolean).map((s) => s.toUpperCase());
  return useQuery({
    queryKey: ["quotes", list],
    enabled: list.length > 0,
    queryFn: () =>
      api<StockQuote[]>(`/api/advisor/quotes${buildQuery({ symbols: list.join(",") })}`),
    staleTime: 60_000,
  });
}
