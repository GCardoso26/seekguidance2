"""Agrega validadores num único relatório."""

from __future__ import annotations

from app.reasoning.types import ConflictItem, ExecutionStep, ValidationReport
from app.reasoning.validation.ambiguity_detector import ambiguity_score
from app.reasoning.validation.consistency_validator import chain_consistent_with_precedence
from app.reasoning.validation.hallucination_guard import unsupported_steps
from app.reasoning.validation.reasoning_confidence import reasoning_confidence as rc_fn
from app.retrieval.types import ChunkHit


def validate_reasoning(
    question: str,
    game_slug: str,
    hits: list[ChunkHit],
    steps: list[ExecutionStep],
    conflicts: list[ConflictItem],
    interaction_chain: list[str],
) -> ValidationReport:
    amb = ambiguity_score(conflicts, len(hits))
    unsup = unsupported_steps(interaction_chain, hits)
    consistent = chain_consistent_with_precedence(question, hits, game_slug, steps)
    valid = consistent and len(steps) > 0 and len(unsup) == 0
    conf = rc_fn(
        n_hits=len(hits),
        conflicts=conflicts,
        reasoning_valid=valid,
        ambiguity=amb,
    )
    return ValidationReport(
        reasoning_valid=valid,
        ambiguity_level=amb,
        unsupported_steps=unsup,
        reasoning_confidence=conf,
    )
