"""Extração de semântica temporal."""

from __future__ import annotations


def extract_timing_semantics(tokens: list[str]) -> list[str]:
    out: list[str] = []
    text = " ".join(tokens)
    if "whenever" in tokens or "at" in tokens:
        out.append("trigger_timing_window")
    if "priority" in tokens:
        out.append("priority_timing")
    if "cleanup" in text:
        out.append("cleanup_timing")
    return sorted(set(out))
