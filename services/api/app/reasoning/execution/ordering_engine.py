"""Motor de ordenação: precedência do jogo + ordenação topológica."""

from __future__ import annotations

from app.reasoning.conflicts.precedence_engine import resolve_precedence_chain
from app.reasoning.execution.dependency_sorter import topological_sort
from app.reasoning.execution.interaction_chain import extract_interaction_tags, humanize_chain
from app.reasoning.types import ExecutionStep


def build_ordered_steps(
    question: str,
    hits: list,
    game_slug: str,
    *,
    max_depth: int,
) -> list[ExecutionStep]:
    tags = extract_interaction_tags(question, hits, game_slug)
    ordered_tags = list(resolve_precedence_chain(game_slug, tags))
    ordered_tags = ordered_tags[:max(1, max_depth)]
    lines = humanize_chain(ordered_tags, game_slug)
    steps: list[ExecutionStep] = []
    prev: tuple[str, ...] = ()
    for i, (tag, desc) in enumerate(zip(ordered_tags, lines, strict=True)):
        sid = f"step_{i}"
        steps.append(ExecutionStep(step_id=sid, description=desc, depends_on=prev, role=tag))
        prev = (sid,)
    return topological_sort(steps)
