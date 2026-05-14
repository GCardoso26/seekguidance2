"""Precisão de interação: ordenação + presença de passos-chave."""

from __future__ import annotations

from app.evaluation.consistency_metrics import ordering_match_score


def interaction_accuracy(expected_ordering: list[str], interaction_chain: list[str]) -> float:
    return ordering_match_score(expected_ordering, interaction_chain)
