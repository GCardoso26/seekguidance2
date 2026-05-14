"""Forecast de entropia de replay."""

from __future__ import annotations


def replay_entropy_forecast(unique_ratio: float) -> dict[str, float]:
    return {"forecast_risk": round(1.0 - unique_ratio, 4)}
