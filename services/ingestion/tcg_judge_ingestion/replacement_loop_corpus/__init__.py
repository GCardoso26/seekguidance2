"""Corpus de loops de replacement."""

from __future__ import annotations

from typing import Any


def replacement_loop_corpus_stub(depth: int) -> dict[str, Any]:
    return {
        "max_observed_depth": depth,
        "branch_divergence_annotations": [{"branch": "stub", "risk": depth > 6}],
        "assistant_notes": ["MTG replacement; analogias noutros TCGs são fracas."],
    }
