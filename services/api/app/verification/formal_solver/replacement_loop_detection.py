"""Deteção de ciclos de replacement / recursão aparente (stub bounded)."""

from __future__ import annotations

from typing import Any


def detect_replacement_loop_hints(effects: list[str], *, cap: int = 12) -> dict[str, Any]:
    """Heurística: repetição de etiquetas iguais sugere loop."""
    seen: set[str] = set()
    dupes: list[str] = []
    for e in effects[:cap]:
        if e in seen:
            dupes.append(e)
        seen.add(e)
    return {"loop_risk": len(dupes) > 0, "duplicate_labels": dupes}
