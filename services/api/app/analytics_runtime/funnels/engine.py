"""Funnel Runtime — incremental funnel metrics from AggregationState + events."""

from __future__ import annotations

from typing import Any

from app.analytics_runtime.aggregators.engine import AggregationState, SourceSnapshot

FUNNEL_DEFS: dict[str, tuple[str, ...]] = {
    "marketplace": ("page_view", "search", "card_view", "add_to_cart", "checkout_started", "purchase"),
    "checkout": ("add_to_cart", "checkout_started", "purchase"),
    "search": ("search", "card_view", "add_to_cart", "purchase"),
    "wishlist": ("wishlist_created", "wishlist_shared", "wishlist_converted", "purchase"),
    "deck_builder": ("deck_shop_open", "add_to_cart", "purchase"),
    "seller": ("listing_create", "purchase"),
    "judge": ("report_created", "report_resolved", "ruling_applied"),
}


def compute_funnels(state: AggregationState, snap: SourceSnapshot) -> dict[str, Any]:
    counts = dict(state.event_counts)
    # Domain orders boost final purchase step
    if state.orders_completed:
        counts["purchase"] = max(counts.get("purchase", 0), state.orders_completed)

    funnels: dict[str, Any] = {}
    for name, steps in FUNNEL_DEFS.items():
        step_rows = []
        prev = None
        for step in steps:
            c = int(counts.get(step, 0))
            drop = None if prev is None or prev == 0 else round(1 - (c / prev), 4)
            step_rows.append({"step": step, "count": c, "drop_off": drop})
            prev = c if c > 0 else prev
        entry = counts.get(steps[0], 0)
        exit_c = counts.get(steps[-1], 0)
        avg_ms = (
            sum(state.funnel_times_ms) / len(state.funnel_times_ms) if state.funnel_times_ms else None
        )
        funnels[name] = {
            "entry": entry,
            "exit": exit_c,
            "conversion": round(exit_c / entry, 6) if entry else 0.0,
            "drop_off_total": round(1 - (exit_c / entry), 4) if entry else None,
            "avg_time_ms": avg_ms,
            "steps": step_rows,
            "segments": _segments(snap, steps[0]),
            "historical": {"previous_conversion": None},  # filled by materializer history
        }
    return {"funnels": funnels, "updated_from": "aggregation_state"}


def _segments(snap: SourceSnapshot, entry_event: str) -> dict[str, int]:
    by_game: dict[str, int] = {}
    for ev in snap.events:
        if str(ev.get("event")) != entry_event:
            continue
        game = str(ev.get("game_slug") or (ev.get("properties") or {}).get("game") or "unknown")
        by_game[game] = by_game.get(game, 0) + 1
    return by_game
