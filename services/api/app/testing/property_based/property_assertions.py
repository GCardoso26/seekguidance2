"""Asserções de propriedades de determinismo/legalidade."""

from __future__ import annotations

from typing import Any


def assert_property_suite(payload: dict[str, Any]) -> dict[str, Any]:
    deterministic = bool(payload.get("deterministic", False))
    legality = bool(payload.get("legality", False))
    return {
        "determinism_preserved": deterministic,
        "legality_preserved": legality,
        "passed": deterministic and legality,
    }
