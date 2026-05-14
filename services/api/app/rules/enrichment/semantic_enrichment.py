"""Enriquecimento semântico autônomo de regras."""

from __future__ import annotations

from typing import Any

from app.rules.enrichment.inferred_constraints import inferred_constraints
from app.rules.enrichment.ontology_alignment import ontology_alignment
from app.rules.enrichment.runtime_annotation import runtime_annotation
from app.rules.enrichment.timing_annotation import timing_annotation


def enrich_semantics(tokens: list[str]) -> dict[str, Any]:
    return {
        "inferred_constraints": inferred_constraints(tokens),
        "runtime_annotations": runtime_annotation(tokens),
        "timing_annotations": timing_annotation(tokens),
        "ontology_alignment": ontology_alignment(tokens),
    }
