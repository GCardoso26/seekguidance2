import type {
  StoreHealthFactor,
  StoreHealthInput,
  StoreHealthResult,
  StoreHealthStatus,
} from "@/types/seller-store-health";
import type { FulfillmentSlaMetrics } from "@/types/seller-dashboard-overview";

const WEIGHT = 0.25;

function kycFactorScore(status?: string | null): number {
  if (status === "verified") return 100;
  if (status === "pending") return 40;
  if (status === "restricted") return 15;
  return 0;
}

function kycHint(status?: string | null): string | undefined {
  if (status === "verified") return "Cadastro verificado";
  if (status === "pending") return "Complete ou aguarde verificação KYC";
  if (status === "restricted") return "Conta com restrições — revise o Stripe";
  return "KYC não iniciado";
}

function slaFactorScore(sla?: FulfillmentSlaMetrics | null): number {
  if (!sla) return 100;
  const total = (sla.picking_overdue ?? 0)
    + (sla.packing_overdue ?? 0)
    + (sla.shipping_overdue ?? 0)
    + (sla.tracking_delayed ?? 0);
  return Math.max(0, 100 - Math.min(100, total * 10));
}

function slaHint(sla?: FulfillmentSlaMetrics | null): string | undefined {
  if (!sla) return undefined;
  const total = (sla.picking_overdue ?? 0)
    + (sla.packing_overdue ?? 0)
    + (sla.shipping_overdue ?? 0)
    + (sla.tracking_delayed ?? 0);
  if (total === 0) return "SLAs em dia";
  return `${total} pendência(s) de fulfillment`;
}

function stockFactorScore(count = 0): number {
  if (count === 0) return 100;
  if (count <= 3) return 70;
  return 40;
}

function stockHint(count = 0): string | undefined {
  if (count === 0) return "Estoque saudável";
  return `${count} item(ns) com estoque baixo`;
}

function ticketsFactorScore(count = 0): number {
  if (count === 0) return 100;
  if (count <= 2) return 70;
  return 30;
}

function ticketsHint(count = 0): string | undefined {
  if (count === 0) return "Sem tickets abertos";
  return `${count} ticket(s) aberto(s)`;
}

function statusFromScore(score: number): StoreHealthStatus {
  if (score >= 70) return "healthy";
  if (score >= 40) return "attention";
  return "critical";
}

export function statusLabel(status: StoreHealthStatus): string {
  if (status === "healthy") return "Saudável";
  if (status === "attention") return "Atenção";
  return "Crítico";
}

function primaryAction(factors: StoreHealthFactor[]): StoreHealthResult["primaryAction"] {
  const worst = [...factors].sort((a, b) => a.score - b.score)[0];
  if (!worst || worst.score >= 100 || !worst.href) return undefined;
  return { label: "Ver pendências", href: worst.href };
}

/** Score operacional da loja (0–100), composto no cliente a partir do overview. */
export function computeStoreHealthScore(input: StoreHealthInput): StoreHealthResult {
  const lowStockCount = input.lowStockCount ?? 0;
  const openTickets = input.openTickets ?? 0;

  const factors: StoreHealthFactor[] = [
    {
      id: "kyc",
      label: "KYC",
      score: kycFactorScore(input.kycStatus),
      hint: kycHint(input.kycStatus),
      href: input.kycStatus === "verified" ? undefined : "#kyc-status",
    },
    {
      id: "sla",
      label: "Fulfillment",
      score: slaFactorScore(input.sla),
      hint: slaHint(input.sla),
      href: "/vendedor/painel/pedidos?tab=to_separate",
    },
    {
      id: "stock",
      label: "Estoque",
      score: stockFactorScore(lowStockCount),
      hint: stockHint(lowStockCount),
      href: lowStockCount > 0 ? "/vendedor/painel/estoque" : undefined,
    },
    {
      id: "tickets",
      label: "Atendimento",
      score: ticketsFactorScore(openTickets),
      hint: ticketsHint(openTickets),
      href: openTickets > 0 ? "/vendedor/painel/atendimento/tickets" : undefined,
    },
  ];

  const score = Math.round(
    factors.reduce((acc, factor) => acc + factor.score * WEIGHT, 0),
  );

  const status = statusFromScore(score);

  return {
    score,
    status,
    factors,
    primaryAction: primaryAction(factors),
  };
}
