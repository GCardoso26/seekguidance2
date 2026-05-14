"""Registo de bundles de replay."""

from __future__ import annotations

from typing import Any


def replay_bundle_registry_stub(ref: str) -> dict[str, Any]:
    return {
        "ref": ref,
        "replay_equivalence_classes": [["eq_stub"]],
        "replay_reliability_score": 0.81,
        "assistant_notes": ["Deterministic replay lineage por bundle."],
    }
