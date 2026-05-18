"""long-run certification modules (production certification)."""
from __future__ import annotations

import importlib

import pytest

_PKG = "app.runtime.production_certification"
_MODULES = [
    "runtime_longrun_soak_engine_v1",
    "runtime_longrun_chaos_engine_v1",
    "runtime_longrun_recovery_engine_v1",
    "runtime_longrun_failover_engine_v1",
    "runtime_longrun_replay_validation_v1",
    "runtime_longrun_slo_validation_v1",
    "runtime_longrun_topology_validation_v1",
    "runtime_longrun_observability_validation_v1",
    "runtime_longrun_operational_validation_v1",
    "runtime_longrun_certification_summary_v1",
]


@pytest.mark.parametrize("name", _MODULES)
def test_longrun_modules_stub(name: str) -> None:
    mod = importlib.import_module(f"{_PKG}.{name}")
    stub = getattr(mod, f"{name}_stub")
    r = stub(f"lr-{name}")
    assert r["integrity_status"] == "ok"
    assert float(r["runtime_confidence"]) > 0


def test_longrun_summary_engine() -> None:
    from app.runtime.production_certification.runtime_longrun_certification_summary_v1 import (
        runtime_longrun_certification_engine_v1,
    )

    out = runtime_longrun_certification_engine_v1("lr-sum")
    assert out["longrun_score"] > 0
