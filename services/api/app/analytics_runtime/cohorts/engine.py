"""Cohort Runtime — D1/D7/D15/D30/D60/D90 retention from event identities."""

from __future__ import annotations

from collections import defaultdict
from datetime import UTC, datetime, timedelta
from typing import Any

from app.analytics_runtime.aggregators.engine import SourceSnapshot

HORIZONS = (1, 7, 15, 30, 60, 90)


def _day(dt: datetime) -> datetime:
    return dt.astimezone(UTC).replace(hour=0, minute=0, second=0, microsecond=0)


def compute_cohorts(snap: SourceSnapshot) -> dict[str, Any]:
    """Build cohorts by first-seen day; retention = return on day+N."""
    first_seen: dict[str, datetime] = {}
    activity: dict[str, set[datetime]] = defaultdict(set)
    segments: dict[str, dict[str, str]] = {}

    for ev in snap.events:
        uid = str(ev.get("user_id") or ev.get("anonymous_id") or "")
        if not uid:
            continue
        raw = ev.get("timestamp")
        try:
            ts = datetime.fromisoformat(str(raw).replace("Z", "+00:00")) if raw else datetime.now(UTC)
        except ValueError:
            ts = datetime.now(UTC)
        d = _day(ts)
        activity[uid].add(d)
        if uid not in first_seen or d < first_seen[uid]:
            first_seen[uid] = d
        props = ev.get("properties") if isinstance(ev.get("properties"), dict) else {}
        segments[uid] = {
            "buyer": "buyer" if ev.get("user_id") else "anon",
            "game": str(ev.get("game_slug") or props.get("game") or "unknown"),
            "device": str(props.get("device") or "unknown"),
            "origin": str(props.get("referrer") or props.get("utm_source") or "direct"),
            "country": str(props.get("country") or "BR"),
            "campaign": str(props.get("utm_campaign") or "none"),
            "tcg": str(ev.get("game_slug") or props.get("game") or "unknown"),
            "seller": "seller" if str(ev.get("event")) == "listing_create" else "non_seller",
        }

    by_cohort: dict[str, dict[str, Any]] = {}
    for uid, start in first_seen.items():
        key = start.date().isoformat()
        bucket = by_cohort.setdefault(key, {"size": 0, "retained": {f"d{h}": 0 for h in HORIZONS}})
        bucket["size"] += 1
        days = activity[uid]
        for h in HORIZONS:
            target = start + timedelta(days=h)
            if target in days or any(abs((d - target).days) == 0 for d in days):
                bucket["retained"][f"d{h}"] += 1

    rates = []
    for key, bucket in sorted(by_cohort.items()):
        size = bucket["size"] or 1
        rates.append(
            {
                "cohort": key,
                "size": bucket["size"],
                **{f"retention_{k}": round(v / size, 4) for k, v in bucket["retained"].items()},
            }
        )

    # Segment rollups (overall retention D7 by dimension)
    segment_stats: dict[str, dict[str, Any]] = {}
    for dim in ("buyer", "game", "device", "origin", "country", "campaign", "tcg", "seller"):
        groups: dict[str, list[str]] = defaultdict(list)
        for uid, seg in segments.items():
            groups[seg.get(dim, "unknown")].append(uid)
        segment_stats[dim] = {
            g: {"users": len(uids), "sample": True} for g, uids in list(groups.items())[:20]
        }

    overall = {f"d{h}": 0.0 for h in HORIZONS}
    if rates:
        for h in HORIZONS:
            overall[f"d{h}"] = round(sum(r[f"retention_d{h}"] for r in rates) / len(rates), 4)

    return {
        "horizons": list(HORIZONS),
        "overall": overall,
        "cohorts": rates[-30:],
        "segments": segment_stats,
    }
