"""Entropia de ontologia em runtime."""

from __future__ import annotations

from typing import Any


def ontology_entropy_runtime_stub(terms: int) -> dict[str, Any]:
    return {
        "terms": terms,
        "entropy_scoring": min(1.0, terms / 5000.0),
        "assistant_notes": ["Ontology drift tracking alimenta este score."],
    }
