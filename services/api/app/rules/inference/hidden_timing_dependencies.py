"""Dependências temporais ocultas."""

from __future__ import annotations


def hidden_timing_dependencies(tokens: list[str]) -> list[str]:
    out: list[str] = []
    if "replacement" in tokens or "instead" in tokens:
        out.append("sba_timing_dependency")
    if "trigger" in tokens or "whenever" in tokens:
        out.append("trigger_insertion_window")
    return sorted(set(out))
