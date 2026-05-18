"""nervous system v5."""
import importlib

import pytest

_PKG = "app.runtime.runtime_nervous_system"
_MODULES = [
    "runtime_nervous_system_engine_v5",
    "runtime_causal_awareness_v5",
    "runtime_governance_traceability_v5",
    "runtime_distributed_supervision_v5",
    "runtime_situational_awareness_v5",
    "runtime_civilization_telemetry_v5",
    "runtime_resilience_risk_cognition_v5",
    "runtime_constitutional_visibility_v5",
    "runtime_multi_org_alignment_v5",
    "runtime_governance_continuity_v5",
    "runtime_long_horizon_cognition_v5",
]


@pytest.mark.parametrize("name", _MODULES)
def test_ns5_stub(name: str) -> None:
    mod = importlib.import_module(f"{_PKG}.{name}")
    r = getattr(mod, f"{name}_stub")(f"ns5-{name}")
    assert r["integrity_status"] == "ok"
