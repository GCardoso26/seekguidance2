"""Simulação histórica simplificada."""

from __future__ import annotations


def historical_state(period: str) -> dict[str, str]:
    return {"period": period, "state_model": f"state_{period}"}
