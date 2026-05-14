"""Taxonomia de interações cross-TCG."""

from __future__ import annotations


def interaction_taxonomy() -> list[str]:
    return [
        "replacement_effect",
        "triggered_ability",
        "continuous_effect",
        "state_based_action",
        "priority_pass",
    ]
