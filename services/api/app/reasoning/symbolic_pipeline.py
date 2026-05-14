"""Orquestra estado simbólico, ramificação limitada e métricas V5."""

from __future__ import annotations

from typing import Any

from app.reasoning.branching.branch_pruner import generate_candidate_paths, prune_paths
from app.reasoning.state_engine.state_legality import validate_state_legality
from app.reasoning.state_engine.state_transition_engine import evolve_along_roles
from app.reasoning.state_engine.transition_validator import validate_transition
from app.reasoning.state_graph.convergence_detector import convergence_summary
from app.reasoning.state_graph.state_graph_builder import build_state_graph
from app.reasoning.types import SymbolicStateResolutionV5
from app.retrieval.types import ChunkHit
from app.rules.rule_registry import get_structured_rules


def run_symbolic_state_pipeline(
    *,
    validated_roles: list[str],
    question: str,
    game_slug: str,
    hits: list[ChunkHit],
    timing: dict[str, Any],
    base_deterministic_confidence: float,
    chain_formally_valid: bool,
) -> SymbolicStateResolutionV5:
    structured = get_structured_rules(game_slug, hits)
    raw_candidates = generate_candidate_paths(validated_roles, question, max_branches=4)
    kept, branch_stats = prune_paths(raw_candidates, max_paths=4, max_depth=16)

    invalid_rejected: list[dict[str, str]] = []
    primary_path = list(validated_roles)
    found_valid = False
    for p in kept:
        states, trans = evolve_along_roles(p, question, game_slug)
        path_ok = True
        for i, t in enumerate(trans):
            before = states[i]
            after = states[i + 1]
            tv = validate_transition(before, after, t["interaction"], game_slug)
            if not tv["transition_valid"]:
                path_ok = False
                invalid_rejected.append(
                    {
                        "reason": "Illegal timing transition",
                        "path": "->".join(p),
                        "detail": str(tv.get("post_state_legality", {})),
                    }
                )
                break
        if path_ok and validate_state_legality(states[-1], game_slug)["state_valid"]:
            primary_path = p
            found_valid = True
            break
    if not found_valid and kept:
        invalid_rejected.append(
            {"reason": "No legal symbolic path among bounded candidates", "path": "all_candidates", "detail": ""}
        )

    states, sym_trans = evolve_along_roles(primary_path, question, game_slug)
    sym_trans_fmt: list[dict[str, str]] = []
    for t in sym_trans:
        sym_trans_fmt.append(
            {
                "from_state": t["from_state"],
                "interaction": t["interaction"],
                "to_state": t["to_state"],
            }
        )
    final_leg = validate_state_legality(states[-1], game_slug)
    conv = convergence_summary(kept, question, game_slug)
    graph = build_state_graph(primary_path, question, game_slug)

    state_ok = bool(final_leg["state_valid"] and chain_formally_valid)
    det = base_deterministic_confidence * (0.92 if state_ok else 0.55)
    det = max(0.05, min(0.98, det + 0.02 * min(1, conv["converged_path_groups"])))

    return SymbolicStateResolutionV5(
        symbolic_state_transition=sym_trans_fmt,
        invalid_paths_rejected=invalid_rejected,
        converged_paths=int(conv["converged_path_groups"]),
        state_legality=state_ok,
        deterministic_confidence=det,
        structured_rules=structured,
        branch_stats=dict(branch_stats, **conv, **{"candidate_paths": len(kept)}),
        state_graph=graph,
        final_legality=final_leg,
    )
