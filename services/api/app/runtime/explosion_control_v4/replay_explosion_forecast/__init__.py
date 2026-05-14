"""Forecast de explosão em replay."""

from __future__ import annotations

from typing import Any


def replay_explosion_forecast_stub(replay_nodes: int, cap: int) -> dict[str, Any]:
    return {
        "replay_nodes": replay_nodes,
        "cap": cap,
        "forecast": "stable" if replay_nodes <= cap else "pressure",
        "assistant_notes": ["Priorizar compactação temporal antes de ramificar novamente."],
    }
