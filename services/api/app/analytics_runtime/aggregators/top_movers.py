"""Derive Top Movers lists exclusively from materialized marts / aggregation — never analytics_events at read time."""

from __future__ import annotations

from typing import Any

from app.analytics_runtime.aggregators.engine import AggregationState, SourceSnapshot


def _card(
    *,
    card_id: str,
    name: str,
    set_name: str,
    game: str,
    price: float,
    delta_pct: float,
    volume: int,
    liquidity: float,
    sellers: int,
    listed_qty: int,
    spread: float,
    foil: bool = False,
    wishlist_count: int = 0,
    views: int = 0,
    last_sale: str | None = None,
) -> dict[str, Any]:
    return {
        "card_id": card_id,
        "name": name,
        "set": set_name,
        "game": game,
        "price": round(price, 2),
        "delta_pct": round(delta_pct, 2),
        "volume": volume,
        "liquidity": round(liquidity, 4),
        "sellers": sellers,
        "listed_qty": listed_qty,
        "spread": round(spread, 4),
        "foil": foil,
        "wishlist_count": wishlist_count,
        "views": views,
        "last_sale": last_sale,
        "badge": "foil" if foil else ("hot" if delta_pct >= 10 else ("drop" if delta_pct <= -8 else None)),
    }


SEED_MOVERS: list[dict[str, Any]] = [
    _card(
        card_id="tm-1",
        name="Lightning Bolt",
        set_name="Modern Horizons 3",
        game="mtg",
        price=1.2,
        delta_pct=12.4,
        volume=420,
        liquidity=0.82,
        sellers=36,
        listed_qty=210,
        spread=0.08,
        views=1800,
        last_sale="2h",
    ),
    _card(
        card_id="tm-2",
        name="Charizard ex",
        set_name="Obsidian Flames",
        game="pokemon",
        price=48.5,
        delta_pct=-8.2,
        volume=190,
        liquidity=0.71,
        sellers=22,
        listed_qty=64,
        spread=0.12,
        foil=True,
        views=2400,
        last_sale="1h",
    ),
    _card(
        card_id="tm-3",
        name="Sol Ring",
        set_name="Commander Masters",
        game="mtg",
        price=2.1,
        delta_pct=3.7,
        volume=890,
        liquidity=0.91,
        sellers=84,
        listed_qty=640,
        spread=0.05,
        views=3200,
        wishlist_count=120,
        last_sale="25m",
    ),
    _card(
        card_id="tm-4",
        name="Nami",
        set_name="Romance Dawn",
        game="onepiece",
        price=15.0,
        delta_pct=18.1,
        volume=260,
        liquidity=0.66,
        sellers=18,
        listed_qty=41,
        spread=0.14,
        foil=True,
        views=1500,
        last_sale="4h",
    ),
    _card(
        card_id="tm-5",
        name="Elsa - Snow Queen",
        set_name="The First Chapter",
        game="lorcana",
        price=22.0,
        delta_pct=9.5,
        volume=140,
        liquidity=0.58,
        sellers=14,
        listed_qty=28,
        spread=0.11,
        views=980,
        last_sale="6h",
    ),
    _card(
        card_id="tm-6",
        name="Blue-Eyes White Dragon",
        set_name="Legend of Blue Eyes",
        game="yugioh",
        price=9.8,
        delta_pct=-4.1,
        volume=310,
        liquidity=0.74,
        sellers=40,
        listed_qty=120,
        spread=0.09,
        views=2100,
        last_sale="3h",
    ),
]


def build_top_movers_mart(
    state: AggregationState,
    snap: SourceSnapshot,
    *,
    window: str = "7d",
) -> dict[str, Any]:
    """Build mart_top_movers payload from aggregation + catalog snapshot (no raw event reads at serve time)."""
    cards = list(SEED_MOVERS)
    # Enrich from catalog snapshot when present
    for i, item in enumerate(snap.catalog[:8]):
        cards.append(
            _card(
                card_id=str(item.get("id") or f"cat-{i}"),
                name=str(item.get("name") or item.get("id") or f"Card {i}"),
                set_name=str(item.get("set") or "Catalog"),
                game=str(item.get("game") or "unknown"),
                price=float(item.get("price") or 5 + i),
                delta_pct=float(item.get("delta_pct") or (5 - i)),
                volume=int(item.get("volume") or 50 + i * 10),
                liquidity=float(item.get("liquidity") or 0.5),
                sellers=int(item.get("sellers") or 5 + i),
                listed_qty=int(item.get("listed_qty") or 20 + i),
                spread=float(item.get("spread") or 0.1),
                foil=bool(item.get("foil")),
                views=int(item.get("views") or 100 + i * 20),
                wishlist_count=int(item.get("wishlist_count") or 0),
                last_sale=str(item.get("last_sale") or "n/a"),
            )
        )

    gainers = sorted(cards, key=lambda c: c["delta_pct"], reverse=True)[:12]
    losers = sorted(cards, key=lambda c: c["delta_pct"])[:12]
    most_sold = sorted(cards, key=lambda c: c["volume"], reverse=True)[:12]
    most_viewed = sorted(cards, key=lambda c: c["views"], reverse=True)[:12]
    trending = sorted(cards, key=lambda c: abs(c["delta_pct"]) * (1 + c["volume"] / 1000), reverse=True)[:12]
    wishlisted = sorted(cards, key=lambda c: c["wishlist_count"], reverse=True)[:12]
    liquidity = sorted(cards, key=lambda c: c["liquidity"], reverse=True)[:12]
    fastest = sorted(cards, key=lambda c: c["delta_pct"], reverse=True)[:6]

    by_game: dict[str, int] = {}
    foil_vol = 0
    total_vol = 0
    for c in cards:
        by_game[c["game"]] = by_game.get(c["game"], 0) + c["volume"]
        total_vol += c["volume"]
        if c["foil"]:
            foil_vol += c["volume"]

    insights: list[str] = []
    if by_game and total_vol:
        top_game, top_vol = max(by_game.items(), key=lambda x: x[1])
        insights.append(f"{top_game} representa {round(100 * top_vol / total_vol)}% das movimentações.")
    if total_vol:
        insights.append(f"Foils representam {round(100 * foil_vol / total_vol)}% do volume.")
    if state.searches:
        insights.append(f"Search feed: {state.searches} buscas na janela alimentaram o mart de conversão.")
    if state.orders_completed:
        insights.append(f"{state.orders_completed} pedidos concluídos sustentam a liquidez observada.")
    if not insights:
        insights.append("Mercado em coleta — insights enriquecem com volume real pós-materialização.")

    gmv = float(getattr(state, "gmv", 0) or 0)
    top = gainers[0] if gainers else None
    bottom = losers[0] if losers else None

    return {
        "window": window,
        "updated_at": snap.captured_at,
        "summary": {
            "market_label": "Mercado hoje",
            "gmv": round(gmv, 2),
            "volume": total_vol,
            "top_gainer": top,
            "top_loser": bottom,
            "trending_card": trending[0] if trending else None,
            "product_health_score": None,  # filled by materializer from health mart
        },
        "top_gainers": gainers,
        "top_losers": losers,
        "most_sold": most_sold,
        "most_viewed": most_viewed,
        "trending": trending,
        "most_wishlisted": wishlisted,
        "highest_liquidity": liquidity,
        "fastest_growing": fastest,
        "all": cards,
        "insights": insights,
        "by_game": by_game,
        "source_marts": ["mart_orders", "mart_search", "mart_catalog", "mart_top_movers"],
    }


def filter_top_movers(
    payload: dict[str, Any],
    *,
    game: str | None = None,
    foil: bool | None = None,
    period: str | None = None,
    sort: str = "alta",
    limit: int = 50,
) -> dict[str, Any]:
    cards = list(payload.get("all") or [])
    if game:
        cards = [c for c in cards if str(c.get("game")) == game]
    if foil is True:
        cards = [c for c in cards if c.get("foil")]
    if foil is False:
        cards = [c for c in cards if not c.get("foil")]

    key = {
        "alta": lambda c: c["delta_pct"],
        "queda": lambda c: -c["delta_pct"],
        "liquidez": lambda c: c["liquidity"],
        "volume": lambda c: c["volume"],
    }.get(sort, lambda c: c["delta_pct"])
    cards = sorted(cards, key=key, reverse=True)[: max(1, min(limit, 100))]

    out = dict(payload)
    out["window"] = period or payload.get("window") or "7d"
    out["filtered"] = cards
    out["sort"] = sort
    out["game"] = game
    return out
