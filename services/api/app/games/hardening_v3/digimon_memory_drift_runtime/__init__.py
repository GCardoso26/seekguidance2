"""Digimon — drift de memória/gauge (stub)."""

from __future__ import annotations

from typing import Any


def digimon_memory_drift_runtime_stub(gauge_delta: float) -> dict[str, Any]:
    return {
        "gauge_delta": gauge_delta,
        "semantic_incompatibility_warning": abs(gauge_delta) > 0.4,
        "assistant_notes": ["Replay divergence diagnostics ligados a gauge semantics."],
    }
