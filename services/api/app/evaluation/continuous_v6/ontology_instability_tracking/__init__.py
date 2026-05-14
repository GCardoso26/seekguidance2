"""Instabilidade de ontologia (histórico)."""

from __future__ import annotations

from typing import Any


def ontology_instability_tracking_stub(bumps: int) -> dict[str, Any]:
    return {"bumps": bumps, "unstable": bumps > 2}
