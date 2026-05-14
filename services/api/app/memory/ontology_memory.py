"""Memória temporal de ontologia."""

from __future__ import annotations


def ontology_versions(memory: list[dict[str, object]]) -> list[str]:
    return [str(x.get("version", "")) for x in memory if x.get("type") == "ontology"]
