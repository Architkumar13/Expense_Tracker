import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Stats } from "@/types/api";

export function useStats() {
  return useQuery({
    queryKey: ["stats"],
    queryFn: () => api<Stats>("/api/expenses/stats"),
  });
}
