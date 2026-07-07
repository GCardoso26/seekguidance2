import type { DashboardOverviewResponse } from "@/types/seller-dashboard-overview";

export type OperationalSeverity = "critical" | "warning" | "info";

export type OperationalActionItem = {
  id: string;
  title: string;
  description: string;
  count: number;
  severity: OperationalSeverity;
  href: string;
  cta: string;
};

export type OperationalSnapshotExtras = {
  chargebacksOpen?: number;
  pendingPayoutCents?: number;
  disputesCount?: number;
  activeListings?: number;
  inactiveListings?: number;
};

function slaOverdueTotal(sla?: DashboardOverviewResponse["fulfillment_sla"]): number {
  if (!sla) return 0;
  return (
    (sla.picking_overdue ?? 0) +
    (sla.packing_overdue ?? 0) +
    (sla.shipping_overdue ?? 0) +
    (sla.tracking_delayed ?? 0)
  );
}

/** Monta fila de ações a partir de dados já expostos pelas APIs existentes (sem novos contratos). */
export function buildOperationalActions(
  overview: DashboardOverviewResponse | undefined,
  extras: OperationalSnapshotExtras = {},
): OperationalActionItem[] {
  if (!overview) return [];

  const items: OperationalActionItem[] = [];
  const m = overview.metrics;
  const slaTotal = slaOverdueTotal(overview.fulfillment_sla);

  if (m.pending_payment > 0) {
    items.push({
      id: "pending_payment",
      title: "Aguardando pagamento",
      description: "Pedidos com pagamento pendente",
      count: m.pending_payment,
      severity: "warning",
      href: "/vendedor/painel/pedidos?tab=pending_payment",
      cta: "Ver pedidos",
    });
  }

  if (m.to_separate > 0) {
    items.push({
      id: "to_separate",
      title: "Aguardando envio",
      description: "Pedidos pagos para separar e enviar",
      count: m.to_separate,
      severity: "critical",
      href: "/vendedor/painel/pedidos?tab=to_separate",
      cta: "Enviar",
    });
  }

  if (slaTotal > 0) {
    items.push({
      id: "sla_overdue",
      title: "SLA em atraso",
      description: "Separação, envio ou rastreio fora do prazo",
      count: slaTotal,
      severity: "critical",
      href: "/vendedor/painel/pedidos?tab=to_separate",
      cta: "Corrigir",
    });
  }

  if ((extras.disputesCount ?? 0) > 0) {
    items.push({
      id: "disputes",
      title: "Pedidos em disputa",
      description: "Requerem atenção imediata",
      count: extras.disputesCount!,
      severity: "critical",
      href: "/vendedor/painel/financeiro/chargebacks",
      cta: "Resolver",
    });
  }

  if ((extras.chargebacksOpen ?? 0) > 0) {
    items.push({
      id: "chargebacks",
      title: "Chargebacks abertos",
      description: "Disputas Stripe em andamento",
      count: extras.chargebacksOpen!,
      severity: "critical",
      href: "/vendedor/painel/financeiro/chargebacks",
      cta: "Responder",
    });
  }

  if (overview.open_tickets > 0) {
    items.push({
      id: "tickets",
      title: "Tickets abertos",
      description: "Clientes aguardando resposta",
      count: overview.open_tickets,
      severity: m.to_separate > 0 ? "warning" : "info",
      href: "/vendedor/painel/atendimento/tickets?action=new",
      cta: "Responder",
    });
  }

  const lowStock = overview.low_stock?.length ?? 0;
  if (lowStock > 0) {
    items.push({
      id: "low_stock",
      title: "Estoque baixo",
      description: "Produtos com quantidade crítica",
      count: lowStock,
      severity: "warning",
      href: "/vendedor/painel/estoque",
      cta: "Repor",
    });
  }

  const noImage = overview.low_stock?.filter((i) => !i.image_url).length ?? 0;
  if (noImage > 0) {
    items.push({
      id: "no_image",
      title: "Sem imagem",
      description: "Itens sem foto no catálogo",
      count: noImage,
      severity: "info",
      href: "/vendedor/painel/listagens",
      cta: "Editar",
    });
  }

  if ((extras.inactiveListings ?? 0) > 0) {
    items.push({
      id: "paused",
      title: "Anúncios pausados",
      description: "Listagens inativas na loja",
      count: extras.inactiveListings!,
      severity: "info",
      href: "/vendedor/painel/listagens?status=inactive",
      cta: "Publicar",
    });
  }

  const trust = overview.reputation?.trust_score;
  if (trust != null && trust < 70) {
    items.push({
      id: "trust",
      title: "Trust Score baixo",
      description: `Pontuação atual: ${trust}`,
      count: 1,
      severity: "warning",
      href: "/vendedor/painel/reputacao",
      cta: "Melhorar",
    });
  }

  if ((extras.pendingPayoutCents ?? 0) > 0) {
    items.push({
      id: "payouts",
      title: "Recebimentos previstos",
      description: "Valores aguardando repasse",
      count: 1,
      severity: "info",
      href: "/vendedor/painel/financeiro/repasses",
      cta: "Acessar",
    });
  }

  const severityOrder: Record<OperationalSeverity, number> = { critical: 0, warning: 1, info: 2 };
  return items.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
}
