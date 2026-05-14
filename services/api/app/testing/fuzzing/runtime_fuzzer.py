"""Runtime fuzzer agregado com caps."""

from __future__ import annotations

from app.testing.fuzzing.mutation_fuzzer import fuzz_mutations
from app.testing.fuzzing.semantic_fuzzer import fuzz_semantics
from app.testing.fuzzing.timing_fuzzer import fuzz_timing


def run_runtime_fuzzer(cases: int = 128, seed_base: int = 1000) -> dict[str, float | int]:
    n = max(1, min(cases, 2000))
    failures = 0
    illegal = 0
    drift_total = 0.0
    for i in range(n):
        t = fuzz_timing(seed_base + i)
        m = fuzz_mutations(seed_base + 7 * i)
        s = fuzz_semantics(seed_base + 13 * i)
        failures += 1 if t["timing_conflicts"] >= 3 else 0
        illegal += m["invalid_mutations"]
        drift_total += s["semantic_drift"]
    return {
        "cases_executed": n,
        "runtime_failures": failures,
        "illegal_states_detected": illegal,
        "avg_semantic_drift": round(drift_total / n, 4),
    }
