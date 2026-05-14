"""Previsão de ramos no mobile (v6 stub)."""

from __future__ import annotations

from typing import Any


def mobile_branch_forecast_stub(width: int) -> dict[str, Any]:
    return {
        "width": width,
        "forecast_prune": max(0, width - 10),
        "assistant_notes": ["Forecast informa UI; juiz decide exploração."],
        "replay_summary": {"risk": "medium" if width > 20 else "low"},
        "deterministic_alignment": {"token": "mbf-v6"},
    }
