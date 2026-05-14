"""Colapso preditivo de ramos."""

from __future__ import annotations

from typing import Any


def predictive_branch_collapse_stub(width: int, cap: int) -> dict[str, Any]:
    return {
        "collapsed": max(0, width - cap),
        "entropy_scoring": min(1.0, width / max(cap, 1)),
        "convergence_confidence": 0.9 if width <= cap else 0.4,
        "branch_collapse_explainability": "Ramos além do cap são agrupados por equivalência fraca.",
        "assistant_notes": ["Explainability-first: motivos de colapso sempre presentes."],
    }
