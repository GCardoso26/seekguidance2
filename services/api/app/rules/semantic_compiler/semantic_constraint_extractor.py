"""Extração de constraints semânticas."""

from __future__ import annotations


def extract_constraints(tokens: list[str]) -> list[str]:
    out: list[str] = []
    if "instead" in tokens:
        out.append("replacement_constraint")
    if "state-based" in " ".join(tokens):
        out.append("sba_constraint")
    if "timestamp" in tokens:
        out.append("timestamp_constraint")
    return sorted(set(out))
