"""Validação de corpus orientada a produção (métricas + deteção de falhas)."""

from __future__ import annotations

from typing import Any


def semantic_coverage_ratio(parsed_fields: dict[str, list[Any]]) -> float:
    keys = ("timing", "windows", "constraints", "dependencies", "replacement_semantics", "chain_stack_semantics")
    filled = sum(1 for k in keys if parsed_fields.get(k))
    return round(filled / max(1, len(keys)), 4)


def orphan_lineage_score(n_chunks: int, n_edges: int) -> float:
    if n_chunks <= 0:
        return 1.0
    return round(min(1.0, n_edges / max(1, n_chunks)), 4)


def parser_confidence_stub(signals: dict[str, Any]) -> float:
    n = sum(len(v) if isinstance(v, list) else 0 for v in signals.values())
    return round(min(1.0, 0.2 + 0.05 * n), 4)
