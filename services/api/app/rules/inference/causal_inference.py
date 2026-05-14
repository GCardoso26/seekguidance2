"""Inferência causal entre eventos semânticos."""

from __future__ import annotations


def infer_causal_relationships(tokens: list[str]) -> list[str]:
    rels: list[str] = []
    if "instead" in tokens:
        rels.append("event_rewrite_causes_legality_shift")
    if "state-based" in " ".join(tokens):
        rels.append("state_check_causes_cleanup")
    return rels
