"""Validação semântica mínima (cobertura de campos extraídos)."""

from __future__ import annotations

from typing import Any


def semantic_coverage_score(fields: dict[str, Any]) -> float:
    keys = ("timing", "windows", "constraints", "dependencies")
    present = sum(1 for k in keys if fields.get(k))
    return present / len(keys)
