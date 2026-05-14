"""APNAP — casos executáveis."""

from __future__ import annotations

from typing import Any


def executable_apnap_case_stub(turn_order: list[str]) -> dict[str, Any]:
    return {"turn_order": turn_order, "solver_expectations": [{"mode": "assist_review"}]}
