"""Drift de ontologia live."""

from __future__ import annotations

from typing import Any


def ontology_drift_runtime_live_stub(delta: float, threshold: float) -> dict[str, Any]:
    return {"delta": delta, "breach": delta > threshold}
