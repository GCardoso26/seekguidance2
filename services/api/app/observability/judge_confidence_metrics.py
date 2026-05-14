"""Confiança agregada para assistência a juiz."""

from __future__ import annotations

from typing import Any


def record_judge_confidence(value: float) -> dict[str, Any]:
    return {"judge_confidence": round(float(value), 4)}
