"""Matriz de maturidade por dimensão e por jogo (0–1 heurístico; configurável)."""

from __future__ import annotations

from typing import Any

GAMES = ("mtg", "yugioh", "pokemon", "onepiece", "digimon", "fab", "lorcana", "riftbound")
DIMS = (
    "ontology",
    "timing",
    "replacement",
    "interaction",
    "tournament",
    "replay",
    "edge_case",
    "semantic_lineage",
)


def default_maturity_matrix() -> dict[str, dict[str, float]]:
    """Valores baseline; substituir por leitura de DB quando disponível."""
    base = {d: 0.45 for d in DIMS}
    out: dict[str, dict[str, float]] = {}
    for g in GAMES:
        row = dict(base)
        if g == "mtg":
            row.update({"ontology": 0.62, "timing": 0.7, "replacement": 0.68})
        elif g == "yugioh":
            row.update({"timing": 0.72, "interaction": 0.7, "edge_case": 0.55})
        elif g == "pokemon":
            row.update({"tournament": 0.5, "replay": 0.48})
        out[g] = row
    return out


def maturity_summary(game_slug: str, matrix: dict[str, dict[str, float]] | None = None) -> dict[str, Any]:
    m = matrix or default_maturity_matrix()
    row = m.get(game_slug.lower(), {})
    avg = round(sum(row.values()) / max(1, len(row)), 4) if row else 0.0
    return {"game": game_slug, "dimensions": row, "average": avg}
