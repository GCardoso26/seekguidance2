"""Validador APNAP (consistência com sequência esperada)."""

from __future__ import annotations

from app.multiplayer.apnap_runtime import apnap_sequence


def validate_apnap_order(active: str, others: list[str], observed: list[str]) -> dict[str, object]:
    expected = apnap_sequence(active, others)
    return {"ok": observed == expected, "expected": expected, "observed": observed}
