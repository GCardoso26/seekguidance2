"""Stress: explosion resilience + solver exhaustion."""

from __future__ import annotations

import pytest
from app.runtime.explosion_control_v4.predictive_runtime_collapse import predictive_explosion_flags
from app.verification.formal_solver_v4.solver_runtime_control import solver_runtime_safeguards

pytestmark = pytest.mark.stress


def test_predictive_many_branches() -> None:
    f = predictive_explosion_flags(
        replay_events=10,
        branches=500,
        ontology_terms=100,
        semantic_spread=0.5,
        temporal_ticks=100,
    )
    assert f["branch_explosion"] is True


def test_solver_exhaustion_caps() -> None:
    s = solver_runtime_safeguards(
        timeout_ms=5000,
        recursion_depth=100,
        contradiction_budget=1,
        proof_compression_cap=2,
        emergency=True,
    )
    assert s["emergency_fallback"] is True
