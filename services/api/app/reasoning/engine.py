"""Fachada do motor de consistência + resolução determinística sob constraints."""

from __future__ import annotations

from app.core.config import Settings
from app.reasoning.chain_validator import validate_formal_chain
from app.reasoning.conflicts.conflict_detector import detect_conflicts
from app.reasoning.conflicts.exception_handler import collect_exception_hints
from app.reasoning.conflicts.override_resolver import continuous_overrides_spell, replacement_overrides_damage
from app.reasoning.constraints.constraint_engine import run_constraint_engine
from app.reasoning.contradictions.contradiction_detector import detect_contradictions
from app.reasoning.deterministic.deterministic_solver import build_steps_from_validated_roles, solve_deterministic
from app.reasoning.distributed_runtime_v11_pipeline import run_distributed_runtime_v11
from app.reasoning.execution.execution_planner import plan_execution
from app.reasoning.formal_runtime_v7_pipeline import run_formal_runtime_v7
from app.reasoning.formal_trust_v8_pipeline import run_formal_trustworthiness_v8
from app.reasoning.reasoning_graphs.graph_builder import build_reasoning_graph
from app.reasoning.semantic_intelligence_v9_pipeline import run_semantic_intelligence_v9
from app.reasoning.semantic_v6_pipeline import run_semantic_gameplay_v6
from app.reasoning.simulation.simulation_engine import simulate
from app.reasoning.simulation.timing_windows import infer_timing
from app.reasoning.symbolic_pipeline import run_symbolic_state_pipeline
from app.reasoning.temporal_semantic_v10_pipeline import run_temporal_semantic_v10
from app.reasoning.types import ConstraintResolutionV4, ReasoningReportV3
from app.reasoning.validation import validate_reasoning
from app.retrieval.types import ChunkHit


def run_reasoning_engine(
    question: str,
    hits: list[ChunkHit],
    game_slug: str,
    settings: Settings | None = None,
) -> ReasoningReportV3:
    raw_steps = plan_execution(question, hits, game_slug, settings=settings)
    planner_roles = [s.role for s in raw_steps if s.role]
    sol = solve_deterministic(planner_roles, game_slug)

    if sol["ok"]:
        validated_roles = list(sol["validated_roles"])
        steps = build_steps_from_validated_roles(validated_roles, game_slug)
        chain = list(sol["validated_chain"])
        rejected_paths = list(sol["rejected_paths"])
        allowed_roles = set(validated_roles)
    else:
        validated_roles = list(dict.fromkeys([r for r in planner_roles if r]))
        steps = raw_steps
        chain = [s.description for s in raw_steps]
        rejected_paths = list(sol["rejected_paths"])
        allowed_roles = None

    timing = infer_timing(question, game_slug)
    formal = validate_formal_chain(validated_roles, game_slug, timing)
    tw = timing.get("window")
    window = tw if isinstance(tw, str) else None
    contras = detect_contradictions(validated_roles, window, game_slug)

    conflicts = detect_conflicts(question, hits, game_slug=game_slug)
    validation = validate_reasoning(question, game_slug, hits, steps, conflicts, chain)
    sim = simulate(question, game_slug, steps, max_steps=20, allowed_roles=allowed_roles)
    graph = build_reasoning_graph(steps, conflicts, timing)
    ce_out = run_constraint_engine(validated_roles, game_slug, timing)

    det_conf = 0.92 if formal["chain_valid"] and sol["ok"] else 0.55
    if rejected_paths:
        det_conf -= 0.06 * min(3, len(rejected_paths))
    if not sol["ok"]:
        det_conf = 0.22
    det_conf = max(0.05, min(0.98, det_conf))

    meta = {
        "reasoning_graph": graph,
        "override_hints": {
            "replacement_overrides_damage": replacement_overrides_damage(hits),
            "continuous_overrides_spell": continuous_overrides_spell(hits),
        },
        "exception_rule_paths": collect_exception_hints(hits),
        "bounded_depth": len(steps),
        "constraint_engine": ce_out,
        "formal_chain_validation": formal,
    }

    v4 = ConstraintResolutionV4(
        validated_chain=list(chain),
        constraint_analysis={
            "precedence_valid": bool(formal["precedence_legal"]),
            "timing_valid": bool(formal["timing_legal"]),
            "dependency_valid": bool(formal["dependency_valid"]),
        },
        rejected_paths=rejected_paths,
        deterministic_confidence=det_conf,
        propagation_chain=list(ce_out.get("propagation_chain") or []),
        contradictions=list(contras),
        valid_chain=bool(formal["chain_valid"] and sol["ok"]),
        constraint_violations=list(formal["constraint_violations"]),
        validation_score=float(formal["validation_score"]),
    )

    v5 = run_symbolic_state_pipeline(
        validated_roles=validated_roles,
        question=question,
        game_slug=game_slug,
        hits=hits,
        timing=timing,
        base_deterministic_confidence=det_conf,
        chain_formally_valid=bool(formal["chain_valid"] and sol["ok"]),
    )
    meta["symbolic_state_graph"] = v5.state_graph
    meta["structured_rules_count"] = len(v5.structured_rules)

    v6 = run_semantic_gameplay_v6(
        validated_roles=validated_roles,
        question=question,
        game_slug=game_slug,
        v5_deterministic_confidence=float(v5.deterministic_confidence),
    )
    meta["semantic_gameplay"] = {
        "casual_steps": len(v6.causal_chain),
        "snapshots_recorded": v6.snapshots_n,
        "semantic_conflicts_n": len(v6.semantic_conflicts),
    }

    v7 = run_formal_runtime_v7(
        validated_roles=validated_roles,
        game_slug=game_slug,
        hits=hits,
        base_confidence=float(v6.deterministic_confidence),
    )
    meta["formal_runtime_v7"] = {
        "compiled_ir_n": len(v7.compiled_ir),
        "replay_hash_prefix": v7.deterministic_replay_hash[:16],
        "sandbox_events_n": len(v7.execution_sandbox_events),
    }
    v8 = run_formal_trustworthiness_v8(
        question=question,
        validated_roles=validated_roles,
        replay_hash_v7=v7.deterministic_replay_hash,
        formal_mutations=v7.formal_mutations,
        semantic_conflicts_n=len(v6.semantic_conflicts),
    )
    meta["formal_trustworthiness_v8"] = {
        "verification_passed": v8.formal_verification.get("verification_passed"),
        "semantic_divergence": v8.differential_analysis.get("semantic_divergence"),
        "drift_risk": v8.drift_detection.get("semantic_regression_risk"),
    }
    first_rule = next((getattr(h, "rule_path", None) for h in hits if getattr(h, "rule_path", None)), "603.3b")
    first_excerpt = next((getattr(h, "text", None) for h in hits if getattr(h, "text", None)), question)
    v9 = run_semantic_intelligence_v9(
        question=question,
        rule_id=str(first_rule or "603.3b"),
        excerpt=str(first_excerpt or question),
        game_slug=game_slug,
    )
    meta["semantic_intelligence_v9"] = {
        "ast_generated": v9.semantic_compilation.get("rule_ast_generated"),
        "ambiguity_uncertainty": v9.ambiguity_detection.get("semantic_uncertainty"),
        "semantic_similarity": v9.semantic_graph.get("semantic_similarity"),
    }
    v10 = run_temporal_semantic_v10(
        question=question,
        game_slug=game_slug,
        rule_id=str(first_rule or "603.3b"),
        v7_replay_hash=v7.deterministic_replay_hash,
    )
    meta["temporal_semantic_v10"] = {
        "historical_period": v10.temporal_reasoning.get("historical_period"),
        "lineage_divergence": v10.semantic_lineage.get("semantic_divergence_score"),
        "deep_drift": v10.drift_analytics.get("deep_semantic_drift"),
    }

    conf = validation.reasoning_confidence
    v11 = run_distributed_runtime_v11(
        question=question,
        game_slug=game_slug,
        reasoning_confidence=float(conf),
        v7_replay_hash=v7.deterministic_replay_hash,
        validated_roles=validated_roles,
    )
    meta["distributed_judge_runtime_v11"] = {
        "partition": v11.distributed_state.get("partition"),
        "chain_verified": v11.distributed_state.get("chain_verified"),
        "v11_replay_shard": v11.distributed_replay.get("shard"),
    }

    return ReasoningReportV3(
        interaction_chain=chain,
        conflicts_detected=conflicts,
        reasoning_confidence=conf,
        timing_analysis=timing,
        validation=validation,
        simulation=sim,
        metadata=meta,
        constraint_resolution=v4,
        symbolic_resolution_v5=v5,
        semantic_resolution_v6=v6,
        formal_runtime_resolution_v7=v7,
        formal_trustworthiness_v8=v8,
        semantic_rule_intelligence_v9=v9,
        temporal_semantic_intelligence_v10=v10,
        distributed_judge_runtime_v11=v11,
    )
