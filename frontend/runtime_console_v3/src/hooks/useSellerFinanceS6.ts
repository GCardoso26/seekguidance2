"use client";

import { useQuery } from "@tanstack/react-query";

export type ReconciliationItem = {
  payment_id: string;
  shop_order_id: string | null;
  payment_status: string;
  payment_amount: number;
  store_amount_cents: number;
  order_status: string | null;
  order_amount: number | null;
  stripe_transfer_id: string | null;
  reconciliation_status: string;
};

export function useFinanceReconciliation(limit = 100) {
  return useQuery({
    queryKey: ["seller-finance-reconciliation", limit],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: String(limit) });
      const res = await fetch(`/api/seller/finance/reconciliation?${params}`);
      if (!res.ok) throw new Error("fetch_failed");
      return res.json() as Promise<{
        items: ReconciliationItem[];
        total: number;
        issues_count: number;
        issues: ReconciliationItem[];
        healthy: boolean;
      }>;
    },
  });
}

export type ChargebackItem = {
  id: string;
  payment_id: string;
  shop_order_id: string | null;
  stripe_dispute_id: string | null;
  status: string;
  amount_cents: number;
  reason: string | null;
  evidence_due_by: string | null;
  opened_at: string;
  resolved_at: string | null;
  payment_method: string;
};

export function useFinanceChargebacks(status?: string) {
  return useQuery({
    queryKey: ["seller-finance-chargebacks", status],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      const res = await fetch(`/api/seller/finance/chargebacks?${params}`);
      if (!res.ok) throw new Error("fetch_failed");
      return res.json() as Promise<{ items: ChargebackItem[]; open_count: number }>;
    },
  });
}

export type AuditEvent = {
  id: string;
  payment_id: string;
  from_status: string | null;
  to_status: string;
  event_type: string | null;
  created_at: string;
  shop_order_id: string | null;
  amount_cents: number;
  payment_method: string;
};

export function useFinanceAuditTrail(limit = 50) {
  return useQuery({
    queryKey: ["seller-finance-audit-trail", limit],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: String(limit) });
      const res = await fetch(`/api/seller/finance/audit-trail?${params}`);
      if (!res.ok) throw new Error("fetch_failed");
      return res.json() as Promise<{ events: AuditEvent[]; total: number }>;
    },
  });
}
