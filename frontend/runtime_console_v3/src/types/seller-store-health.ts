import type { FulfillmentSlaMetrics } from "@/types/seller-dashboard-overview";

export type StoreHealthStatus = "healthy" | "attention" | "critical";

export type StoreHealthFactorId = "kyc" | "sla" | "stock" | "tickets";

export type StoreHealthFactor = {
  id: StoreHealthFactorId;
  label: string;
  score: number;
  hint?: string;
  href?: string;
};

export type StoreHealthInput = {
  kycStatus?: string | null;
  sla?: FulfillmentSlaMetrics | null;
  lowStockCount?: number;
  openTickets?: number;
};

export type StoreHealthResult = {
  score: number;
  status: StoreHealthStatus;
  factors: StoreHealthFactor[];
  primaryAction?: { label: string; href: string };
};
