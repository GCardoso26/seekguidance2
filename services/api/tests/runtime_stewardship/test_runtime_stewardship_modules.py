"""runtime_stewardship modules."""
from __future__ import annotations

import importlib

import pytest

_PKG = "app.runtime.runtime_stewardship"
_MODULES = [
    "runtime_stewardship_engine_v1",
    "runtime_stewardship_registry_v1",
    "runtime_stewardship_policy_v1",
    "runtime_stewardship_governance_v1",
    "runtime_stewardship_compatibility_v1",
    "runtime_stewardship_risk_v1",
    "runtime_stewardship_release_v1",
    "runtime_stewardship_lifecycle_v1",
    "runtime_stewardship_adoption_v1",
    "runtime_stewardship_summary_v1",
]


@pytest.mark.parametrize("name", _MODULES)
def test_stw_stub(name: str) -> None:
    mod = importlib.import_module(f"{_PKG}.{name}")
    stub = getattr(mod, f"{name}_stub")
    r = stub(f"stw-{name}")
    assert r["integrity_status"] == "ok"
    assert float(r["runtime_confidence"]) > 0


def test_stewardship_engine_artifact() -> None:
    from pathlib import Path

    from app.runtime.runtime_stewardship.runtime_stewardship_summary_v1 import runtime_stewardship_engine_v1

    runtime_stewardship_engine_v1("stw-art")
    assert (Path("generated/runtime_artifacts/runtime_stewardship_v1/stw-art-policy.json")).is_file()
