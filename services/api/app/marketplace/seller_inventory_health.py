"""Inventory Health score — heurísticas (Application Layer, sem Aggregate)."""

from __future__ import annotations

from typing import Any


def compute_item_health(item: dict[str, Any]) -> dict[str, Any]:
    """Score 0–100 + flags. Somente sugestão/diagnóstico."""
    score = 100
    flags: list[str] = []

    qty = int(item.get("quantity") or 0)
    price = int(item.get("price_cents") or 0)
    image = item.get("image_url")
    language = (item.get("language") or "").strip()
    status = (item.get("status") or "active").lower()
    title = (item.get("title") or "").strip()

    if not image:
        score -= 20
        flags.append("missing_image")
    if price <= 0:
        score -= 25
        flags.append("missing_price")
    if qty <= 0:
        score -= 20
        flags.append("out_of_stock")
    elif qty <= 3:
        score -= 8
        flags.append("low_stock")
    if status in {"inactive", "archived", "paused"}:
        score -= 15
        flags.append("paused")
    if not language:
        score -= 10
        flags.append("missing_language")
    if len(title) < 3:
        score -= 10
        flags.append("poor_title")
    if item.get("set_code") in (None, "", "INVALID"):
        # only penalize cards when set expected
        if item.get("kind") == "cards" and not item.get("set_code"):
            score -= 5
            flags.append("missing_set")

    score = max(0, min(100, score))
    band = "healthy" if score >= 80 else "warn" if score >= 50 else "critical"
    return {
        "score": score,
        "band": band,
        "flags": flags,
    }


def enrich_items_with_health(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    for raw in items:
        item = dict(raw)
        health = compute_item_health(item)
        item["health"] = health
        item["health_score"] = health["score"]
        out.append(item)
    return out


def average_health(items: list[dict[str, Any]]) -> float:
    if not items:
        return 0.0
    scores = [int((i.get("health") or {}).get("score") or i.get("health_score") or 0) for i in items]
    return round(sum(scores) / len(scores), 1)
