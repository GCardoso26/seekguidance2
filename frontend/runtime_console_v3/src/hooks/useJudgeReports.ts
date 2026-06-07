"use client";

import { useQuery } from "@tanstack/react-query";
import type { InfractionReport, InfractionStatus } from "@/lib/infractions/schema";

export type ReportFilters = {
  status?: InfractionStatus;
  assigned_to?: string;
};

export function useJudgeReports(filters: ReportFilters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.assigned_to) params.set("assigned_to", filters.assigned_to);

  return useQuery({
    queryKey: ["judge-reports", filters],
    queryFn: async () => {
      const res = await fetch(`/api/judge/infractions?${params}`);
      if (!res.ok) throw new Error("Falha ao carregar reports");
      return (await res.json()) as InfractionReport[];
    },
    refetchInterval: 10_000,
  });
}

export function useInfractionReport(id: string | undefined) {
  return useQuery({
    queryKey: ["infraction-report", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const res = await fetch(`/api/judge/infractions/${id}`);
      if (!res.ok) throw new Error("Report não encontrado");
      return (await res.json()) as InfractionReport;
    },
  });
}

export function useJudgeStats() {
  return useQuery({
    queryKey: ["judge-stats"],
    queryFn: async () => {
      const res = await fetch("/api/bff/runtime/judge/metrics");
      if (!res.ok) {
        return { open: 0, investigating: 0, overdue: 0, resolvedToday: 0, total: 0 };
      }
      return (await res.json()) as {
        open: number;
        investigating: number;
        overdue: number;
        resolvedToday: number;
        total?: number;
      };
    },
    refetchInterval: 15_000,
  });
}
