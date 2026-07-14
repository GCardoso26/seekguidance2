"""Incremental aggregation state derived from operational + event snapshots."""

from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass, field
from datetime import UTC, datetime, timedelta
from typing import Any


@dataclass
class SourceSnapshot:
    """Normalized read model for materializers. Never returned to dashboards."""

    events: list[dict[str, Any]] = field(default_factory=list)
    orders: list[dict[str, Any]] = field(default_factory=list)
    sellers: list[dict[str, Any]] = field(default_factory=list)
    buyers: list[dict[str, Any]] = field(default_factory=list)
    catalog: list[dict[str, Any]] = field(default_factory=list)
    analytics_health: dict[str, Any] = field(default_factory=dict)
    performance: dict[str, Any] = field(default_factory=dict)
    availability: float = 0.999
    captured_at: str = field(default_factory=lambda: datetime.now(UTC).isoformat())


@dataclass
class AggregationState:
    orders_completed: int = 0
    gmv: float = 0.0
    buyers_with_purchase: set[str] = field(default_factory=set)
    sellers_with_sale: set[str] = field(default_factory=set)
    searches: int = 0
    search_clicks: int = 0
    zero_results: int = 0
    sessions: set[str] = field(default_factory=set)
    users_24h: set[str] = field(default_factory=set)
    event_counts: dict[str, int] = field(default_factory=lambda: defaultdict(int))
    wishlist_created: int = 0
    wishlist_converted: int = 0
    checkout_started: int = 0
    purchases_events: int = 0
    funnel_times_ms: list[float] = field(default_factory=list)

    def ingest(self, snap: SourceSnapshot, *, window_days: int = 7) -> None:
        since = datetime.now(UTC) - timedelta(days=window_days)
        since_24h = datetime.now(UTC) - timedelta(hours=24)

        for order in snap.orders:
            status = str(order.get("status") or "").lower()
            if status not in {"completed", "paid", "fulfilled", "success"}:
                continue
            ts = _parse_dt(order.get("created_at") or order.get("timestamp"))
            if ts and ts < since:
                continue
            self.orders_completed += 1
            self.gmv += float(order.get("total") or order.get("amount") or 0)
            buyer = order.get("buyer_id") or order.get("user_id")
            seller = order.get("seller_id")
            if buyer:
                self.buyers_with_purchase.add(str(buyer))
            if seller:
                self.sellers_with_sale.add(str(seller))

        for ev in snap.events:
            name = str(ev.get("event") or "")
            self.event_counts[name] += 1
            ts = _parse_dt(ev.get("timestamp"))
            props = ev.get("properties") if isinstance(ev.get("properties"), dict) else {}
            sid = props.get("session_id") or ev.get("session_id")
            uid = ev.get("user_id") or ev.get("anonymous_id")
            if sid:
                self.sessions.add(str(sid))
            if uid and (ts is None or ts >= since_24h):
                self.users_24h.add(str(uid))

            if name in {"search", "search_used"}:
                self.searches += 1
                if props.get("zero_results") is True or props.get("result_count") == 0:
                    self.zero_results += 1
            elif name in {"card_buy_click", "recommendation_click", "SearchResultClicked"}:
                self.search_clicks += 1
            elif name == "wishlist_created":
                self.wishlist_created += 1
            elif name == "wishlist_converted":
                self.wishlist_converted += 1
            elif name == "checkout_started":
                self.checkout_started += 1
            elif name == "purchase":
                self.purchases_events += 1
                if isinstance(props.get("time_to_purchase_ms"), int | float):
                    self.funnel_times_ms.append(float(props["time_to_purchase_ms"]))

        # Prefer domain orders; fall back to purchase events for NSM volume proxy
        if self.orders_completed == 0 and self.purchases_events:
            self.orders_completed = self.purchases_events


def _parse_dt(raw: Any) -> datetime | None:
    if raw is None:
        return None
    if isinstance(raw, datetime):
        return raw if raw.tzinfo else raw.replace(tzinfo=UTC)
    try:
        return datetime.fromisoformat(str(raw).replace("Z", "+00:00"))
    except ValueError:
        return None


def aggregate(snap: SourceSnapshot, *, window_days: int = 7) -> AggregationState:
    state = AggregationState()
    state.ingest(snap, window_days=window_days)
    return state
