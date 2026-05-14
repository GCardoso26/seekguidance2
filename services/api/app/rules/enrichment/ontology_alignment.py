"""Alinhamento com ontologia cross-TCG."""

from __future__ import annotations


def ontology_alignment(tokens: list[str]) -> list[str]:
    mappings: list[str] = []
    if "stack" in tokens:
        mappings.append("STACK_LIKE_SYSTEM")
    if "chain" in tokens:
        mappings.append("CHAIN_SYSTEM")
    if "instead" in tokens or "replacement" in tokens:
        mappings.append("REPLACEMENT_SYSTEM")
    return sorted(set(mappings))
