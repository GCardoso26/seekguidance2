"""Colapso de ramos de replay."""

from __future__ import annotations

from typing import Any


def replay_branch_collapse_v2_stub(width: int, cap: int) -> dict[str, Any]:
    return {
        "collapsed": max(0, width - cap),
        "replay_equivalence_merge": True,
        "assistant_notes": ["Explainability de colapso assistente."],
    }
