"""Matriz de stubs institutional operating."""
from __future__ import annotations

import importlib

import pytest

_MATRIX = [
    ("app.runtime.runtime_institutional_governance", "institutional_governance_score"),
    ("app.runtime.runtime_long_horizon_governance", "long_horizon_governance_score"),
    ("app.runtime.runtime_governance_continuity", "governance_continuity_score"),
    ("app.runtime.runtime_operational_memory", "operational_memory_score"),
    ("app.runtime.runtime_knowledge_continuity", "knowledge_continuity_score"),
    ("app.runtime.runtime_historical_reasoning", "historical_reasoning_score"),
    ("app.runtime.runtime_organizational_resilience", "organizational_resilience_score"),
    ("app.runtime.runtime_operational_survivability", "operational_survivability_score"),
    ("app.runtime.runtime_failure_absorption", "failure_absorption_score"),
    ("app.runtime.runtime_executive_oversight", "executive_oversight_score"),
    ("app.runtime.runtime_human_governance", "human_governance_score"),
    ("app.runtime.runtime_operational_council", "operational_council_score"),
]


@pytest.mark.parametrize("pkg,score_key", _MATRIX)
def test_v31_pkg_stub_matrix(pkg: str, score_key: str) -> None:
    mod = importlib.import_module(pkg)
    stub_name = next(n for n in dir(mod) if n.endswith('_stub') and 'summary' not in n)
    r = getattr(mod, stub_name)(f'mx-{pkg.split(".")[-1]}')
    assert r["integrity_status"] == "ok"
    assert score_key in r or float(r['runtime_confidence']) > 0
