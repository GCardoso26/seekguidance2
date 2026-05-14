"""Resolução simples de overrides textuais entre trechos (heurística)."""

from __future__ import annotations

from app.retrieval.types import ChunkHit


def replacement_overrides_damage(hits: list[ChunkHit]) -> bool:
    blob = " ".join((h.text or "").lower() for h in hits[:12])
    return "instead" in blob and ("damage" in blob or "would" in blob)


def continuous_overrides_spell(hits: list[ChunkHit]) -> bool:
    blob = " ".join((h.text or "").lower() for h in hits[:12])
    return "can't" in blob and ("cast" in blob or "play" in blob)
