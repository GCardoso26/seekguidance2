"""Normalização determinística de semântica."""

from __future__ import annotations

from typing import Any


def normalize_semantics(parsed: dict[str, Any]) -> dict[str, Any]:
    tokens = sorted(set(str(t) for t in parsed.get("tokens", [])))
    return {**parsed, "tokens": tokens, "normalized": True}
