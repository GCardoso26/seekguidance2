"use client";

import { useQuery } from "@tanstack/react-query";
import { mapJudgeCertification, type JudgeCertification } from "@/types/judge-calls";

export function useJudgeCertification() {
  const query = useQuery({
    queryKey: ["judge-certification"],
    queryFn: async () => {
      const res = await fetch("/api/judge/certifications/me");
      if (res.status === 403) return [] as JudgeCertification[];
      if (!res.ok) throw new Error("Falha ao carregar certificação");
      const data = (await res.json()) as Record<string, unknown>[];
      return data.map(mapJudgeCertification);
    },
  });

  return {
    certifications: query.data ?? [],
    certification: query.data?.[0] ?? null,
    isLoading: query.isLoading,
    error: query.error,
  };
}
