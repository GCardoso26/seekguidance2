"""Inferência de dependências explícitas/implícitas."""

from __future__ import annotations


def infer_dependencies(tokens: list[str]) -> list[str]:
    deps: list[str] = []
    if "instead" in tokens:
        deps.extend(["event_legality", "sba_timing"])
    if "trigger" in tokens or "whenever" in tokens:
        deps.append("trigger_insertion")
    if "layer" in tokens:
        deps.append("layer_ordering")
    return sorted(set(deps))
