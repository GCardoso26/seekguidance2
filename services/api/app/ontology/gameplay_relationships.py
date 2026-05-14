"""Relações semânticas de gameplay."""

from __future__ import annotations


def relationships() -> list[dict[str, str]]:
    return [
        {"source": "replacement_effect", "rel": "inherits", "target": "state_modification"},
        {"source": "triggered_ability", "rel": "interacts_with", "target": "stack"},
        {"source": "triggered_ability", "rel": "interacts_with", "target": "priority"},
        {"source": "triggered_ability", "rel": "interacts_with", "target": "state_based_action"},
    ]
