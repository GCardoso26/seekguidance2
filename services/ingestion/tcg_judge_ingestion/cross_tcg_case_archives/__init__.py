"""Arquivo de casos cross-TCG (análogos fracos apenas)."""

from __future__ import annotations

from typing import Any


def cross_tcg_case_archive_stub(slugs: list[str]) -> dict[str, Any]:
    return {
        "games": slugs,
        "cross_version_semantic_lineage": [],
        "ontology_drift_annotations": [{"game": s, "drift": 0.1} for s in slugs],
        "assistant_notes": ["Nunca transportar legalidade literal entre TCGs."],
    }
