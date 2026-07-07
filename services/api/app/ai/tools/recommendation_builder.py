"""Regras determinísticas de recomendação — nunca no LLM."""

from __future__ import annotations

from typing import Any

from app.ai.contracts.types import SellerContextBundle, SellerInsight


def _cents_to_brl(cents: int) -> str:
    return f"{cents / 100:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


def build_recommendations(context: SellerContextBundle) -> list[SellerInsight]:
    insights: list[SellerInsight] = []
    inv = context.inventory
    orders = context.orders
    pricing = context.pricing
    tickets = context.tickets
    rep = context.reputation
    fin = context.finance

    low_stock = int(inv.get("low_stock_count") or 0)
    if low_stock > 0:
        insights.append(
            SellerInsight(
                id="inv-low-stock",
                category="inventory",
                priority="high" if low_stock >= 5 else "medium",
                title=f"{low_stock} produtos com estoque baixo",
                description="Itens com quantidade abaixo do limite operacional podem gerar cancelamentos.",
                reason="Estoque abaixo de 3 unidades detectado no catálogo ativo.",
                impact="Reduz risco de oversell e melhora conversão.",
                cta_label="Ver estoque",
                cta_href="/vendedor/painel/estoque",
                metric_value=low_stock,
            )
        )

    missing_img = int(inv.get("missing_image_count") or 0)
    if missing_img > 0:
        insights.append(
            SellerInsight(
                id="inv-missing-image",
                category="inventory",
                priority="medium",
                title=f"{missing_img} anúncios sem imagem",
                description="Anúncios sem imagem convertem menos no marketplace.",
                reason="Listings ativos sem card_image_url no catálogo.",
                impact="Melhora CTR e confiança do comprador.",
                cta_label="Revisar anúncios",
                cta_href="/vendedor/painel/listagens?filter=no_image",
                metric_value=missing_img,
            )
        )

    paused = int(inv.get("paused_listings_count") or 0)
    if paused > 0:
        insights.append(
            SellerInsight(
                id="inv-paused",
                category="inventory",
                priority="low",
                title=f"{paused} anúncios pausados",
                description="Produtos inativos não geram receita.",
                reason="Status inactive em card_listings.",
                impact="Reativar pode recuperar vendas.",
                cta_label="Ver pausados",
                cta_href="/vendedor/painel/listagens?status=inactive",
                metric_value=paused,
            )
        )

    late = int(orders.get("late_orders_count") or 0)
    if late > 0:
        insights.append(
            SellerInsight(
                id="ord-late",
                category="orders",
                priority="high",
                title=f"{late} pedidos atrasados",
                description="Pedidos fora do SLA de fulfillment afetam reputação.",
                reason="Métricas de SLA indicam atraso no envio.",
                impact="Priorizar envio reduz chargebacks e melhora score.",
                cta_label="Ver pedidos",
                cta_href="/vendedor/painel/pedidos?tab=late",
                metric_value=late,
            )
        )

    pending = int(orders.get("to_separate") or 0) + int(orders.get("pending_payment") or 0)
    if pending > 0:
        insights.append(
            SellerInsight(
                id="ord-pending",
                category="orders",
                priority="high" if pending >= 5 else "medium",
                title=f"{pending} pedidos aguardando ação",
                description="Separação e confirmação de pagamento pendentes.",
                reason="Fila operacional do dashboard overview.",
                impact="Acelera ciclo de receita.",
                cta_label="Abrir pedidos",
                cta_href="/vendedor/painel/pedidos",
                metric_value=pending,
            )
        )

    open_tix = int(tickets.get("open_count") or 0)
    if open_tix > 0:
        insights.append(
            SellerInsight(
                id="tix-open",
                category="tickets",
                priority="high",
                title=f"{open_tix} tickets aguardando resposta",
                description="Tickets abertos impactam satisfação e reputação.",
                reason="Tickets com status open ou waiting_customer.",
                impact="Resposta rápida melhora NPS e reduz disputas.",
                cta_label="Responder tickets",
                cta_href="/vendedor/painel/atendimento/tickets?status=open",
                metric_value=open_tix,
            )
        )

    above = int(pricing.get("above_market_count") or 0)
    if above > 0:
        insights.append(
            SellerInsight(
                id="price-above",
                category="pricing",
                priority="medium",
                title=f"{above} preços acima da média",
                description="Preços acima do mercado reduzem competitividade.",
                reason="Pricing intelligence detectou delta > threshold.",
                impact="Ajuste pode aumentar conversão sem perder margem total.",
                cta_label="Ver sugestões",
                cta_href="/vendedor/painel/insights?tab=pricing",
                metric_value=above,
                prepared_action_type="bulk_price_update",
            )
        )

    below = int(pricing.get("below_market_count") or 0)
    if below > 0:
        insights.append(
            SellerInsight(
                id="price-below",
                category="pricing",
                priority="medium",
                title=f"{below} preços abaixo da média",
                description="Margem abaixo do mercado — risco de lucro reduzido.",
                reason="Listings com preço significativamente abaixo da mediana.",
                impact="Revisão protege margem.",
                cta_label="Analisar pricing",
                cta_href="/vendedor/painel/estatisticas/inteligencia",
                metric_value=below,
            )
        )

    chargebacks = int(fin.get("chargebacks_open") or 0)
    if chargebacks > 0:
        insights.append(
            SellerInsight(
                id="fin-chargeback",
                category="finance",
                priority="high",
                title=f"{chargebacks} chargeback(s) em aberto",
                description="Disputas financeiras requerem ação imediata.",
                reason="Chargebacks ou pedidos disputed detectados.",
                impact="Evita perdas e penalidades na reputação.",
                cta_label="Ver financeiro",
                cta_href="/vendedor/painel/financeiro/stripe",
                metric_value=chargebacks,
            )
        )

    delta = float(rep.get("score_delta") or 0)
    if delta < -1:
        insights.append(
            SellerInsight(
                id="rep-drop",
                category="reputation",
                priority="high",
                title=f"Reputação caiu {abs(delta):.0f} pontos",
                description="Queda recente no trust score.",
                reason="Histórico de reputation_score_history.",
                impact="Recuperar SLA e atendimento reverte tendência.",
                cta_label="Ver reputação",
                cta_href="/vendedor/painel/reputacao",
                metric_value=delta,
            )
        )

    priority_order = {"high": 0, "medium": 1, "low": 2}
    insights.sort(key=lambda i: (priority_order[i.priority], -(i.metric_value or 0)))
    return insights


def build_pricing_action_plan(context: SellerContextBundle, insight_id: str | None) -> dict[str, Any]:
    items = context.pricing.get("items") or []
    plan_items = []
    for row in items[:20]:
        if row.get("suggestion") not in ("lower", "raise"):
            continue
        plan_items.append(
            {
                "resource_type": "listing",
                "resource_id": str(row.get("listing_id")),
                "field": "price_cents",
                "current_value": int(row.get("listing_price_cents") or 0),
                "proposed_value": int(row.get("suggested_price_cents") or row.get("listing_price_cents") or 0),
                "label": str(row.get("card_name") or row.get("listing_id")),
            }
        )
    return {
        "action_type": "bulk_price_update",
        "title": "Plano de atualização de preços",
        "description": "Revise cada item antes de confirmar. Nenhuma alteração foi aplicada.",
        "items": plan_items,
        "requires_confirmation": True,
        "execute_endpoint": "/runtime/judge/seller/listings/bulk-price",
        "execute_method": "PATCH",
        "insight_id": insight_id,
    }


def brief_highlights(context: SellerContextBundle, insights: list[SellerInsight]) -> list[str]:
    highlights: list[str] = []
    for ins in insights[:5]:
        highlights.append(ins.title)
    payout = int(context.finance.get("expected_payout_cents") or 0)
    if payout > 0:
        highlights.append(f"Recebimentos previstos: R$ {_cents_to_brl(payout)}")
    rev = int(context.orders.get("revenue_today_cents") or 0)
    if rev > 0:
        highlights.append(f"Receita hoje: R$ {_cents_to_brl(rev)}")
    return highlights
