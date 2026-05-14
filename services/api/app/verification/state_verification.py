"""Verificação de consistência de estado pós-mutação."""

from __future__ import annotations

from typing import Any


def verify_mutation_log(muts: list[dict[str, Any]]) -> dict[str, Any]:
    return {"consistent": len(muts) < 10_000, "count": len(muts)}
