"""Inferência de relações semânticas implícitas."""

from __future__ import annotations


def infer_semantic_relationships(tokens: list[str]) -> list[str]:
    out: list[str] = []
    if "replacement" in tokens:
        out.append("replacement_affects_trigger_queue")
    if "layer" in tokens:
        out.append("layer_affects_modification_order")
    return out
