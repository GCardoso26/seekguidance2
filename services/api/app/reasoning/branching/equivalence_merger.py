"""Agrega caminhos com o mesmo estado final canónico."""

from __future__ import annotations

from collections import defaultdict

from app.reasoning.state_engine.state_transition_engine import evolve_along_roles


def merge_equivalent_paths(
    paths: list[list[str]],
    question: str,
    game_slug: str,
) -> tuple[dict[str, list[list[str]]], int]:
    buckets: dict[str, list[list[str]]] = defaultdict(list)
    for p in paths:
        states, _ = evolve_along_roles(p, question, game_slug)
        key = states[-1].canonical_key()
        buckets[key].append(p)
    converged = sum(1 for _k, vs in buckets.items() if len(vs) > 1)
    return dict(buckets), converged
