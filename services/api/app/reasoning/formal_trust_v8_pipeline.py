"""Pipeline V8: formal trustworthiness gameplay reasoning."""

from __future__ import annotations

from app.reasoning.types import FormalTrustworthinessResolutionV8
from app.runtime.invariants.legality_invariants import check_legality_invariants
from app.runtime.invariants.mutation_invariants import check_mutation_invariants
from app.runtime.invariants.runtime_guards import guard_runtime_limits
from app.runtime.invariants.state_invariants import check_state_invariants
from app.runtime.replay.replay_validation import validate_replay
from app.testing.adversarial.adversarial_runtime import run_adversarial_runtime
from app.testing.fuzzing.runtime_fuzzer import run_runtime_fuzzer
from app.testing.property_based.legality_fuzzing import run_legality_fuzzing
from app.verification.differential.differential_runner import run_differential_simulation
from app.verification.drift.semantic_drift_detector import detect_semantic_drift
from app.verification.formal_assertions import assert_formal_invariants
from app.verification.legality_proofs import build_legality_proofs
from app.verification.precedence_verification import verify_precedence_order
from app.verification.runtime_soundness import runtime_soundness_score
from app.verification.symbolic_consistency import symbolic_consistency


def run_formal_trustworthiness_v8(
    *,
    question: str,
    validated_roles: list[str],
    replay_hash_v7: str,
    formal_mutations: list[dict[str, object]],
    semantic_conflicts_n: int,
) -> FormalTrustworthinessResolutionV8:
    replay_payload = {
        "question": question,
        "roles": list(validated_roles),
        "mutations": list(formal_mutations),
        "replay_hash_v7": replay_hash_v7,
    }
    replay = validate_replay(replay_payload, runs=3)
    diff = run_differential_simulation(question, validated_roles, replay["stable_replay_hash"])

    precedence = verify_precedence_order(validated_roles)
    mutation_violations = check_mutation_invariants(formal_mutations)
    state_violations = check_state_invariants(
        {
            "semantic_conflicts": semantic_conflicts_n,
            "roles": len(validated_roles),
        }
    )
    legality_violations = check_legality_invariants(
        precedence_legal=bool(precedence["precedence_legal"]),
        deterministic=bool(replay["deterministic"]),
    )
    guard_violations = guard_runtime_limits(
        recursion_depth=len(validated_roles),
        max_depth=64,
        queue_size=len(formal_mutations),
        max_queue=256,
    )
    formal_core = assert_formal_invariants(
        constraints_ok=(len(state_violations) == 0),
        precedence_ok=bool(precedence["precedence_legal"]),
        mutations_ok=(len(mutation_violations) == 0),
    )
    proofs = build_legality_proofs(
        legal=(len(legality_violations) == 0),
        deterministic=bool(replay["deterministic"]),
    )
    soundness = runtime_soundness_score(
        failures=len(mutation_violations) + len(state_violations) + len(guard_violations),
        checks=max(1, len(formal_mutations) + len(validated_roles)),
    )

    fuzzing = run_runtime_fuzzer(cases=256)
    legality_fuzz = run_legality_fuzzing(cases=64)
    fuzzing["illegal_states_detected"] = int(
        fuzzing["illegal_states_detected"]
    ) + int(legality_fuzz["illegal_states_detected"])
    adversarial = run_adversarial_runtime()

    drift = detect_semantic_drift(
        rule_id="603.3b",
        old_hash=replay_hash_v7,
        new_hash=replay["stable_replay_hash"],
        semantic_divergence=float(diff["semantic_divergence"]),
    )
    symbolic = symbolic_consistency(validated_roles, snapshots=max(1, len(validated_roles)))

    formal_verification = {
        "invariants_checked": [
            "state_invariants",
            "mutation_invariants",
            "precedence_invariants",
            "legality_invariants",
            "runtime_guards",
            "symbolic_consistency",
        ],
        "verification_passed": bool(formal_core["verification_passed"]),
        "constraint_proofs": proofs,
        "runtime_soundness": round(soundness, 4),
        "violations": {
            "state": state_violations,
            "mutation": mutation_violations,
            "legality": legality_violations,
            "guards": guard_violations,
            "symbolic": [] if symbolic["symbolic_consistent"] else ["symbolic_inconsistency"],
        },
    }
    diff_block = {
        "pipeline_a_hash": diff["pipeline_a_hash"],
        "pipeline_b_hash": diff["pipeline_b_hash"],
        "semantic_divergence": diff["semantic_divergence"],
        "differences_detected": diff["differences_detected"],
    }
    replay_block = {
        "deterministic": replay["deterministic"],
        "stable_replay_hash": replay["stable_replay_hash"],
        "mutation_consistency": replay["mutation_consistency"],
    }
    drift_block = {
        "version_change_detected": drift["version_change_detected"],
        "semantic_regression_risk": drift["semantic_regression_risk"],
    }
    fuzz_block = {
        "cases_executed": fuzzing["cases_executed"],
        "runtime_failures": int(fuzzing["runtime_failures"])
        + (1 if adversarial["recursion_overflow"] else 0)
        + (1 if adversarial["graph_exploded"] else 0),
        "illegal_states_detected": fuzzing["illegal_states_detected"],
    }
    return FormalTrustworthinessResolutionV8(
        formal_verification=formal_verification,
        differential_analysis=diff_block,
        replay_validation=replay_block,
        drift_detection=drift_block,
        fuzzing_results=fuzz_block,
    )
