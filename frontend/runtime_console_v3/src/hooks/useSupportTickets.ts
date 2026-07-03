"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type SupportTicket = {
  id: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  customer_name?: string | null;
  created_at?: string;
};

export function useSupportTickets(status?: string, page = 1) {
  return useQuery({
    queryKey: ["support-tickets", status ?? "all", page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: "25" });
      if (status) params.set("status", status);
      const res = await fetch(`/api/seller/tickets?${params}`);
      if (!res.ok) throw new Error("fetch_failed");
      return res.json() as Promise<{ tickets: SupportTicket[]; total: number }>;
    },
  });
}

export function useCreateTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const res = await fetch("/api/seller/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("create_failed");
      return res.json();
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["support-tickets"] });
      void qc.invalidateQueries({ queryKey: ["dashboard", "overview"] });
    },
  });
}

export function useTicketDetail(ticketId: string | null) {
  return useQuery({
    queryKey: ["support-ticket", ticketId],
    queryFn: async () => {
      const res = await fetch(`/api/seller/tickets/${encodeURIComponent(ticketId!)}`);
      if (!res.ok) throw new Error("fetch_failed");
      return res.json();
    },
    enabled: Boolean(ticketId),
  });
}
