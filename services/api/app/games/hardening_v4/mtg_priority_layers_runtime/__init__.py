"""MTG — APNAP, replacement, SBA (stub)."""

from __future__ import annotations

from typing import Any


def mtg_priority_layers_runtime_stub(*, apnap_pressure: bool, sba_tick_risk: bool) -> dict[str, Any]:
    return {
        "apnap_pressure": apnap_pressure,
        "sba_tick_risk": sba_tick_risk,
        "assistant_notes": ["Dependency layers MTG; não exportar como regra universal."],
    }
