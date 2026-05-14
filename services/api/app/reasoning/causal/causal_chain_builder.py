"""Constrói cadeia causal legível a partir de papéis + contexto."""

from __future__ import annotations

from typing import Any


def build_causal_chain_from_roles(roles: list[str], question: str) -> list[dict[str, Any]]:
    ql = (question or "").lower()
    chain: list[dict[str, Any]] = []
    prev_cause = "GameContext"
    if "combat" in ql:
        chain.append({"event": "CombatDamageStep", "caused_by": prev_cause})
        prev_cause = "CombatDamageStep"
    for r in roles:
        ev = _role_to_event(r)
        chain.append({"event": ev, "caused_by": prev_cause})
        prev_cause = ev
    return chain[:24]


def _role_to_event(role: str) -> str:
    return {
        "event": "GameEvent",
        "replacement": "ReplacementApplied",
        "sba": "SBAProcessed",
        "triggered": "TriggerScheduled",
        "stack": "StackResolution",
        "priority": "PriorityPassed",
        "layer": "LayerRecalculated",
    }.get(role, f"Semantic_{role}")
