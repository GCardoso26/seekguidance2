"use client";

import { useQuery } from "@tanstack/react-query";
import type { SellerDailyBrief } from "@/types/seller-ai";

export function useSellerAiBrief(enabled = true) {
  return useQuery({
    queryKey: ["seller-ai-brief"],
    queryFn: async () => {
      const res = await fetch("/api/seller/ai/brief", { cache: "no-store" });
      if (!res.ok) throw new Error("Falha ao carregar brief");
      return (await res.json()) as SellerDailyBrief;
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}
