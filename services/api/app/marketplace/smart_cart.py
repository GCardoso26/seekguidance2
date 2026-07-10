"""Smart Cart — otimização determinística do carrinho (Sprint 14).

Nunca altera o carrinho automaticamente. Retorna planos sugeridos para o comprador.
Não acessa Catalog BC. Usa apenas itens do shopping cart + read models de loja/reputação.
"""

from __future__ import annotations

from collections import defaultdict
from typing import Any, Literal

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.marketplace import shop_cart

OptimizeGoal = Literal[
    "lowest_price",
    "fewest_stores",
    "highest_reputation",
    "best_value",
    "fastest_shipping",
]


def _parse_items(cart: dict[str, Any]) -> list[dict[str, Any]]:
    raw = cart.get("items") or []
    if isinstance(raw, str):
        import json

        raw = json.loads(raw)
    return list(raw) if isinstance(raw, list) else []


def _group_by_store(items: list[dict[str, Any]]) -> dict[str, list[dict[str, Any]]]:
    groups: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for item in items:
        sid = str(item.get("store_id") or "unknown")
        groups[sid].append(item)
    return dict(groups)


async def _store_meta(session: AsyncSession, store_ids: list[str]) -> dict[str, dict[str, Any]]:
    if not store_ids:
        return {}
    rows = (
        await session.execute(
            text(
                """
                SELECT s.id, s.name, s.slug, s.average_rating, s.review_count,
                       COALESCE(ss.trust_score, 75.0) AS trust_score,
                       COALESCE(ss.seller_level, 'new') AS seller_level,
                       COALESCE(ss.orders_completed, 0) AS orders_completed
                FROM tcg_judge.stores s
                LEFT JOIN tcg_judge.seller_scores ss ON ss.store_id = s.id
                WHERE s.id = ANY(CAST(:ids AS uuid[]))
                """
            ),
            {"ids": store_ids},
        )
    ).mappings().all()
    return {str(r["id"]): dict(r) for r in rows}


def _estimate_shipping_cents(store_item_count: int) -> int:
    """Estimativa heurística — frete real no checkout. Não é regra de negócio de cobrança."""
    base = 1200
    per_extra = 150
    return base + max(0, store_item_count - 1) * per_extra


def _estimate_sla_days(trust: float) -> int:
    if trust >= 90:
        return 2
    if trust >= 80:
        return 3
    if trust >= 70:
        return 4
    return 5


def _score_plan(
    *,
    goal: OptimizeGoal,
    products_cents: int,
    shipping_cents: int,
    store_count: int,
    avg_trust: float,
    sla_days: int,
) -> float:
    total = products_cents + shipping_cents
    if goal == "lowest_price":
        return -float(total)
    if goal == "fewest_stores":
        return -float(store_count * 10_000 + total)
    if goal == "highest_reputation":
        return avg_trust * 1000 - store_count * 50
    if goal == "fastest_shipping":
        return -float(sla_days * 10_000 + shipping_cents)
    # best_value
    return avg_trust * 10 - (total / 100.0) - store_count * 5


async def analyze_cart(
    session: AsyncSession,
    user_id: str,
    *,
    goal: OptimizeGoal = "best_value",
) -> dict[str, Any]:
    cart = await shop_cart.get_cart(session, user_id)
    items = _parse_items(cart)
    if not items:
        return {
            "cart_id": str(cart.get("id") or ""),
            "goal": goal,
            "items": [],
            "by_store": [],
            "summary": {
                "products_cents": 0,
                "estimated_shipping_cents": 0,
                "estimated_total_cents": 0,
                "store_count": 0,
                "avg_trust": 0.0,
                "estimated_sla_days": 0,
                "savings_cents": 0,
            },
            "strategies": [],
            "suggested_goal": goal,
            "auto_reorder_applied": False,
        }

    groups = _group_by_store(items)
    meta = await _store_meta(session, list(groups.keys()))

    by_store: list[dict[str, Any]] = []
    products_cents = 0
    shipping_total = 0
    trusts: list[float] = []
    sla_days_list: list[int] = []

    naive_shipping = 0
    for store_id, store_items in groups.items():
        store = meta.get(store_id) or {}
        line_cents = sum(int(i.get("price_cents", 0)) * int(i.get("quantity", 0)) for i in store_items)
        qty = sum(int(i.get("quantity", 0)) for i in store_items)
        ship = _estimate_shipping_cents(qty)
        trust = float(store.get("trust_score") or 75.0)
        sla = _estimate_sla_days(trust)
        products_cents += line_cents
        shipping_total += ship
        trusts.append(trust)
        sla_days_list.append(sla)
        naive_shipping += 1200 * qty  # baseline "um frete por item"
        by_store.append(
            {
                "store_id": store_id,
                "store_name": store.get("name") or "Loja",
                "store_slug": store.get("slug"),
                "trust_score": trust,
                "seller_level": store.get("seller_level") or "new",
                "items": store_items,
                "subtotal_cents": line_cents,
                "estimated_shipping_cents": ship,
                "estimated_sla_days": sla,
            }
        )

    avg_trust = sum(trusts) / len(trusts) if trusts else 0.0
    max_sla = max(sla_days_list) if sla_days_list else 0
    savings = max(0, naive_shipping - shipping_total)

    strategies: list[dict[str, Any]] = []
    for g in ("lowest_price", "fewest_stores", "highest_reputation", "best_value", "fastest_shipping"):
        score = _score_plan(
            goal=g,  # type: ignore[arg-type]
            products_cents=products_cents,
            shipping_cents=shipping_total,
            store_count=len(by_store),
            avg_trust=avg_trust,
            sla_days=max_sla,
        )
        strategies.append(
            {
                "goal": g,
                "score": round(score, 2),
                "label": {
                    "lowest_price": "Menor preço total",
                    "fewest_stores": "Menos lojas (menos fretes)",
                    "highest_reputation": "Maior confiança",
                    "best_value": "Melhor custo-benefício",
                    "fastest_shipping": "Menor prazo estimado",
                }[g],
                "selected": g == goal,
            }
        )
    strategies.sort(key=lambda s: s["score"], reverse=True)

    # Ordenação sugerida (não muta): lojas por trust desc ou preço
    sorted_stores = sorted(
        by_store,
        key=lambda s: (
            -s["trust_score"] if goal in {"highest_reputation", "best_value"} else 0,
            s["estimated_shipping_cents"] + s["subtotal_cents"],
            s["estimated_sla_days"],
        ),
    )

    return {
        "cart_id": str(cart.get("id") or ""),
        "goal": goal,
        "items": items,
        "by_store": sorted_stores,
        "summary": {
            "products_cents": products_cents,
            "estimated_shipping_cents": shipping_total,
            "estimated_total_cents": products_cents + shipping_total,
            "store_count": len(by_store),
            "avg_trust": round(avg_trust, 1),
            "estimated_sla_days": max_sla,
            "savings_cents": savings,
        },
        "strategies": strategies,
        "suggested_goal": strategies[0]["goal"] if strategies else goal,
        "auto_reorder_applied": False,
        "hint": "Reorganização é sugestão. Confirme no checkout antes de pagar.",
    }
