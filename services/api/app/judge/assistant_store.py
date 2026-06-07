"""Armazenamento em memória para Fase A — Judge Assistant (MVP)."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta
from typing import Any

_INFRACTIONS: dict[str, dict[str, Any]] = {}


def _now() -> datetime:
    return datetime.now(UTC)


def classify_infraction(description: str) -> dict[str, Any]:
    keywords = {
        "slow_play": ["tempo", "demorando", "timeout", "clock", "lento"],
        "deck_error": ["carta errada", "deck", "sideboard", "banlist"],
        "cheating": ["trapaceou", "trapaca", "viu", "marcou"],
        "outside_assistance": ["ajuda externa", "coach"],
        "game_rule_violation": ["regra", "violacao", "violação"],
    }
    severity_map = {
        "slow_play": "minor",
        "deck_error": "major",
        "cheating": "severe",
        "outside_assistance": "severe",
        "game_rule_violation": "major",
    }
    category_map = {
        "slow_play": "procedural",
        "deck_error": "procedural",
        "cheating": "ethical",
        "outside_assistance": "ethical",
        "game_rule_violation": "gameplay",
    }
    desc = description.lower()
    scores = {k: sum(1 for w in words if w in desc) for k, words in keywords.items()}
    best = max(scores, key=scores.get) if any(scores.values()) else "other"
    word_count = len(keywords.get(best, [])) or 1
    confidence = min(scores.get(best, 0) / word_count, 1.0) if best != "other" else 0.2
    return {
        "suggested_type": best if scores.get(best, 0) else "other",
        "suggested_severity": severity_map.get(best, "minor"),
        "suggested_category": category_map.get(best, "procedural"),
        "confidence": confidence,
    }


def sla_deadline(level: str = "regular") -> datetime:
    minutes = {"casual": 10, "regular": 5, "competitive": 2}.get(level, 5)
    return _now() + timedelta(minutes=minutes)


def create_infraction(data: dict[str, Any]) -> dict[str, Any]:
    classification = classify_infraction(data.get("description", ""))
    inf_id = str(uuid.uuid4())
    now = _now().isoformat()
    report = {
        "id": inf_id,
        "match_id": data["match_id"],
        "tournament_id": data.get("tournament_id"),
        "match_tcg": data.get("match_tcg", "lorcana"),
        "reported_by": data["reported_by"],
        "reported_by_seat": data["reported_by_seat"],
        "target_player": data.get("target_player"),
        "target_player_seat": data.get("target_player_seat"),
        "type": data.get("type") or classification["suggested_type"],
        "severity": classification["suggested_severity"],
        "category": classification["suggested_category"],
        "description": data["description"],
        "evidence": data.get("evidence") or {},
        "status": "open",
        "assigned_judge": None,
        "resolution": None,
        "appeal": None,
        "reported_at": now,
        "sla_deadline": sla_deadline(data.get("tournament_level", "regular")).isoformat(),
        "created_at": now,
        "updated_at": now,
        "classification_confidence": classification["confidence"],
    }
    _INFRACTIONS[inf_id] = report
    return report


def list_infractions(
    status: str | None = None,
    assigned_to: str | None = None,
    tournament_id: str | None = None,
) -> list[dict[str, Any]]:
    items = list(_INFRACTIONS.values())
    if status:
        items = [r for r in items if r.get("status") == status]
    if assigned_to:
        items = [r for r in items if r.get("assigned_judge") == assigned_to]
    if tournament_id:
        items = [r for r in items if r.get("tournament_id") == tournament_id]
    return sorted(items, key=lambda r: r.get("sla_deadline", ""))


def get_infraction(infraction_id: str) -> dict[str, Any] | None:
    return _INFRACTIONS.get(infraction_id)


def update_infraction(infraction_id: str, patch: dict[str, Any]) -> dict[str, Any] | None:
    report = _INFRACTIONS.get(infraction_id)
    if not report:
        return None
    for key in ("status", "assigned_judge", "resolution", "appeal", "first_response_at", "resolved_at"):
        if key in patch:
            report[key] = patch[key]
    report["updated_at"] = _now().isoformat()
    return report


def judge_metrics() -> dict[str, Any]:
    items = list(_INFRACTIONS.values())
    now = _now()
    open_count = sum(1 for r in items if r.get("status") == "open")
    investigating = sum(1 for r in items if r.get("status") == "investigating")
    overdue = sum(
        1
        for r in items
        if r.get("status") in ("open", "investigating")
        and r.get("sla_deadline")
        and datetime.fromisoformat(str(r["sla_deadline"]).replace("Z", "+00:00")) < now
    )
    resolved_today = sum(
        1
        for r in items
        if r.get("status") == "resolved"
        and str(r.get("resolved_at", "")).startswith(now.date().isoformat())
    )
    return {
        "open": open_count,
        "investigating": investigating,
        "overdue": overdue,
        "resolvedToday": resolved_today,
        "total": len(items),
    }
