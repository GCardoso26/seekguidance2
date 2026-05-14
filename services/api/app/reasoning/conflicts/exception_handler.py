"""Mapeamento leve de exceções textuais em regras recuperadas."""

from __future__ import annotations

from app.retrieval.types import ChunkHit


def collect_exception_hints(hits: list[ChunkHit]) -> list[str]:
    hints: list[str] = []
    for h in hits[:15]:
        t = (h.text or "")
        if "Exception:" in t or "exception:" in t.lower():
            hints.append(h.rule_path or "unknown")
    return hints
