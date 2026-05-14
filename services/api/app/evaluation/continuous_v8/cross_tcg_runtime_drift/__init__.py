"""Drift cross-TCG em runtime."""

from __future__ import annotations

from typing import Any


def cross_tcg_runtime_drift_v8_stub(tcgs: list[str]) -> dict[str, Any]:
    return {
        "tcgs": tcgs,
        "replay_drift_timelines": [],
        "ontology_drift_timelines": [],
        "assistant_notes": ["Soft normalization: comparar tendências, não legalidade literal."],
    }
