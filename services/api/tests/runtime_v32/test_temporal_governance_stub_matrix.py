"""Matriz stubs temporal governance."""
import importlib

import pytest

_MATRIX = [
    ("app.runtime.runtime_temporal_governance", "temporal_governance_score"),
    ("app.runtime.runtime_temporal_coordination", "temporal_coordination_score"),
    ("app.runtime.runtime_evolutionary_timeline", "evolutionary_timeline_score"),
    ("app.runtime.runtime_evolutionary_stability", "evolutionary_stability_score"),
    ("app.runtime.runtime_structural_evolution", "structural_evolution_score"),
    ("app.runtime.runtime_change_resilience", "change_resilience_score"),
    ("app.runtime.runtime_operational_time", "operational_time_score"),
    ("app.runtime.runtime_longitudinal_state", "longitudinal_state_score"),
    ("app.runtime.runtime_historical_continuity", "historical_continuity_score"),
    ("app.runtime.runtime_change_governance", "change_governance_score"),
    ("app.runtime.runtime_evolution_control", "evolution_control_score"),
    ("app.runtime.runtime_operational_transition", "operational_transition_score"),
]


@pytest.mark.parametrize("pkg,score_key", _MATRIX)
def test_v32_pkg_stub_matrix(pkg: str, score_key: str) -> None:
    mod = importlib.import_module(pkg)
    stub_name = next(n for n in dir(mod) if n.endswith('_stub') and 'summary' not in n)
    r = getattr(mod, stub_name)(f'mx-{pkg.split(".")[-1]}')
    assert r["integrity_status"] == "ok"
    assert score_key in r or float(r['runtime_confidence']) > 0
