"""recovery coordination."""
import importlib

import pytest

_PKG = "app.runtime.runtime_recovery_coordination"
_MODULES = [
    "runtime_recovery_coordination_engine_v1",
    "runtime_recovery_orchestration_v1",
    "runtime_recovery_playbooks_v1",
    "runtime_recovery_federation_v1",
    "runtime_recovery_replay_v1",
    "runtime_recovery_deployment_v1",
    "runtime_recovery_governance_v1",
    "runtime_recovery_metrics_v1",
    "runtime_recovery_escalation_v1",
    "runtime_recovery_coordination_summary_v1",
]


@pytest.mark.parametrize("name", _MODULES)
def test_recovery_stub(name: str) -> None:
    mod = importlib.import_module(f"{_PKG}.{name}")
    r = getattr(mod, f"{name}_stub")(f"rec-{name}")
    assert r["integrity_status"] == "ok"
