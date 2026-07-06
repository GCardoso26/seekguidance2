"use client";

import { useQuery } from "@tanstack/react-query";
import type { SellerReputationResponse } from "@/types/seller-reputation";

export function useSellerReputation() {
  return useQuery({
    queryKey: ["seller-reputation"],
    queryFn: async () => {
      const res = await fetch("/api/seller/reputation");
      if (!res.ok) throw new Error("fetch_failed");
      return res.json() as Promise<SellerReputationResponse>;
    },
  });
}
