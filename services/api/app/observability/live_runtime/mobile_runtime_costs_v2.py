"""Custos de runtime móvel v2 (stub)."""

from __future__ import annotations

from typing import Any


def mobile_runtime_costs_v2_stub(usd_estimate: float) -> dict[str, Any]:
    return {
        "usd_estimate": usd_estimate,
        "assistant_notes": ["Estimativa local de dados móveis; cloud continua opcional."],
        "replay_summary": {"egress_kb": 42},
        "deterministic_alignment": {"token": "mrcv2-cost"},
        "lineage_replay_awareness": {"slice": "mrcv2-cost"},
    }
