"""Pipeline formal de runtime + IR para explainability V7."""

from __future__ import annotations

import hashlib
import json
from typing import Any

from app.reasoning.types import FormalRuntimeResolutionV7
from app.retrieval.types import ChunkHit
from app.rules.composition.rule_composer import compose_documents
from app.rules.ir.rule_ir_models import RuleIRDocument
from app.rules.ir_cache import get_ir_compiler_cache
from app.rules.rule_registry import get_structured_rules
from app.runtime.mutations.mutation_conflicts import detect_conflicts
from app.runtime.mutations.mutation_engine import MutationEngine
from app.runtime.runtime_scheduler import RuntimeScheduler
from app.runtime.sandbox.execution_limits import ExecutionLimits
from app.runtime.simulation_runtime import SimulationRuntime
from app.verification.invariant_checks import check_non_negative_counters
from app.verification.legality_assertions import assert_chain_legal
from app.verification.state_verification import verify_mutation_log


def _convergence_quality(branches_pruned: int, branches_total: int) -> float:
    if branches_total <= 0:
        return 1.0
    return max(0.0, min(1.0, branches_pruned / branches_total))


def _replay_hash(payload: dict[str, Any]) -> str:
    raw = json.dumps(payload, sort_keys=True, ensure_ascii=False, default=str)
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def run_formal_runtime_v7(
    *,
    validated_roles: list[str],
    game_slug: str,
    hits: list[ChunkHit],
    base_confidence: float,
) -> FormalRuntimeResolutionV7:
    structured = get_structured_rules(game_slug, hits)
    cache = get_ir_compiler_cache()
    compiled_docs: list[RuleIRDocument] = []
    compile_errors: list[str] = []
    for row in structured:
        try:
            compiled_docs.append(cache.compile_key(row))
        except Exception as e:
            compile_errors.append(f"{row.get('rule_id')}: {e}")

    constraints = {"priority_order": [r for r in validated_roles if r]}
    sched = RuntimeScheduler()
    runtime_execution_order = sched.schedule(validated_roles, constraints)

    mut_engine = MutationEngine()
    formal_mutations = mut_engine.materialize_from_ir(compiled_docs)
    conflicts = detect_conflicts(formal_mutations)

    limits = ExecutionLimits()
    sim = SimulationRuntime(limits=limits)
    sim_out = sim.run_roles(runtime_execution_order)
    sandbox_events = list(sim_out.get("events") or [])
    for ev in mut_engine.history.entries[-8:]:
        sandbox_events.append({"type": "mutation_history", "detail": ev})
    if compile_errors:
        sandbox_events.append({"type": "compile_error", "messages": compile_errors[:8]})

    composition = compose_documents(compiled_docs)

    verif: list[dict[str, Any]] = [
        assert_chain_legal({"roles_non_empty": bool(validated_roles)}),
        verify_mutation_log(formal_mutations),
    ]
    verif.append({"mutation_conflicts": conflicts, "count": len(conflicts)})

    inv_state = {"branch_depth": len(validated_roles), "conflicts": len(conflicts)}
    inv_violations = check_non_negative_counters(inv_state)

    runtime_constraints_applied = [
        "deterministic_role_order",
        "mutation_cap_per_rule",
        "execution_step_cap",
    ]
    if limits.max_execution_steps < len(validated_roles):
        runtime_constraints_applied.append("truncated_role_sequence")

    conv = _convergence_quality(max(0, 4 - len(conflicts)), 4)
    stability_penalty = 0.02 * len(compile_errors)
    runtime_convergence_score = max(0.0, min(1.0, 0.55 * base_confidence + 0.45 * conv - stability_penalty))

    replay_payload = {
        "order": runtime_execution_order,
        "mutations": formal_mutations,
        "compiled_rule_ids": [d.rule_id for d in compiled_docs],
    }
    deterministic_replay_hash = _replay_hash(replay_payload)

    return FormalRuntimeResolutionV7(
        compiled_ir=[d.to_dict() for d in compiled_docs],
        runtime_execution_order=runtime_execution_order,
        formal_mutations=formal_mutations,
        state_invariants_checked=[f"non_negative:{k}" for k in inv_violations]
        + ["mutation_log_integrity"]
        + ["role_presence"],
        deterministic_replay_hash=deterministic_replay_hash,
        runtime_constraints_applied=runtime_constraints_applied,
        semantic_compositions=[composition],
        execution_sandbox_events=sandbox_events,
        verification_results=verif,
        runtime_convergence_score=runtime_convergence_score,
    )
