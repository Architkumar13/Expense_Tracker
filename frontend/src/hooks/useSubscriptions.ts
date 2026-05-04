import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Subscription } from "@/types/api";

export function useSubscriptions() {
  return useQuery({
    queryKey: ["subscriptions"],
    queryFn: () => api<Subscription[]>("/api/subscriptions"),
  });
}
