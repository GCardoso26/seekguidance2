"""Conflitos adversariais de layers."""

from __future__ import annotations


def layer_conflict_detected(active_layers: list[str]) -> bool:
    return len(active_layers) != len(set(active_layers))
