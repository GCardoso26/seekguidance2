"""Alinhamento errata ↔ texto (stub determinístico)."""

from __future__ import annotations


def errata_alignment_score(has_errata_anchor: bool, text_matches_anchor: bool) -> float:
    if not has_errata_anchor:
        return 0.5
    return 0.95 if text_matches_anchor else 0.35
