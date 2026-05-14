"""Traces de legalidade distribuída."""

from __future__ import annotations

from typing import Any


def distributed_legality_trace_bundle(parts: list[str]) -> dict[str, Any]:
    return {"parts": parts, "joined": True}
