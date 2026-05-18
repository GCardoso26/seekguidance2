"""runtime_continuous_certification modules."""
from __future__ import annotations

import importlib

import pytest

_PKG = "app.runtime.runtime_continuous_certification"
_MODULES = [
    "runtime_continuous_certification_engine_v1",
    "runtime_longrun_certification_v1",
    "runtime_reliability_certification_v1",
    "runtime_replay_certification_runtime_v1",
    "runtime_federation_certification_v1",
    "runtime_observability_certification_v1",
    "runtime_governance_certification_v1",
    "runtime_deployment_certification_v1",
    "runtime_ecosystem_certification_v1",
    "runtime_certification_summary_v1",
]


@pytest.mark.parametrize("name", _MODULES)
def test_ccert_stub(name: str) -> None:
    mod = importlib.import_module(f"{_PKG}.{name}")
    stub = getattr(mod, f"{name}_stub")
    r = stub(f"ccert-{name}")
    assert r["integrity_status"] == "ok"
    assert float(r["runtime_confidence"]) > 0
