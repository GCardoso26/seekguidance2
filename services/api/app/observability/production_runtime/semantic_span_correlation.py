"""Correlação de spans semânticos."""

from __future__ import annotations

from typing import Any


def correlate_semantic_spans(names: list[str]) -> dict[str, Any]:
    return {"chain": names, "correlated": len(names) > 0}
