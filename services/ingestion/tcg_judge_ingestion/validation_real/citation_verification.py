"""Verificação de citações mínimas."""

from __future__ import annotations


def citation_verification(citations: list[str]) -> dict[str, object]:
    return {"ok": len(citations) > 0, "count": len(citations)}
