"use client";

import { useQuery } from "@tanstack/react-query";
import type { LigaPassProfile } from "@/types/gamification";

export function useLigaPass() {
  return useQuery({
    queryKey: ["liga-pass", "me"],
    queryFn: async () => {
      const res = await fetch("/api/gamification/xp/me", { cache: "no-store" });
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Liga Pass indisponível");
      return res.json() as Promise<LigaPassProfile>;
    },
    staleTime: 60_000,
  });
}
