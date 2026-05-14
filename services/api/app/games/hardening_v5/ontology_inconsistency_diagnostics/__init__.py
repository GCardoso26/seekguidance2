"""Diagnósticos de inconsistência de ontologia."""

from __future__ import annotations

from typing import Any


def ontology_inconsistency_diagnostics_v5_stub(issues: int) -> dict[str, Any]:
    return {
        "issues": issues,
        "ontology_inconsistency_diagnostics": issues == 0,
        "assistant_notes": ["Ontologia inconsistente exige revisão humana de políticas."],
    }
