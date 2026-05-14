"""Deltas de rulings legacy."""

from __future__ import annotations

from typing import Any


def legacy_ruling_delta_stub(old_hash: str, new_hash: str) -> dict[str, Any]:
    return {
        "old": old_hash,
        "new": new_hash,
        "temporal_legality_conflicts": old_hash != new_hash,
        "assistant_notes": ["Lineage temporal executável deve referenciar ambos os hashes."],
    }
