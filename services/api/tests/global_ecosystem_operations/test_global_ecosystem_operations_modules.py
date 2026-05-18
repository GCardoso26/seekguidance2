"""global_ecosystem_operations modules."""
from __future__ import annotations

import importlib

import pytest

_PKG = "app.runtime.ecosystem_operations"
_MODULES = [
    "global_ecosystem_operations_engine_v1",
    "global_runtime_adoption_v1",
    "global_sdk_distribution_v1",
    "global_release_coordination_v1",
    "global_support_coordination_v1",
    "global_ecosystem_stability_v1",
    "global_partner_runtime_v1",
    "global_runtime_rollout_v1",
    "global_operational_alignment_v1",
    "global_ecosystem_summary_v1",
]


@pytest.mark.parametrize("name", _MODULES)
def test_glob_stub(name: str) -> None:
    mod = importlib.import_module(f"{_PKG}.{name}")
    stub = getattr(mod, f"{name}_stub")
    r = stub(f"glob-{name}")
    assert r["integrity_status"] == "ok"
    assert float(r["runtime_confidence"]) > 0
