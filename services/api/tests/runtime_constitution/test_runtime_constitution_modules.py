"""runtime_constitution."""
from __future__ import annotations

import importlib

import pytest

_PKG = "app.runtime.runtime_constitution"
_MODULES = [
    "runtime_constitution_engine_v1",
    "runtime_constitutional_coordination_v1",
    "runtime_charter_enforcement_v1",
    "runtime_policy_harmonization_const_v1",
    "runtime_governance_continuity_v1",
    "runtime_constitutional_reasoning_v1",
    "runtime_sovereignty_balancing_v1",
    "runtime_policy_interoperability_v1",
    "runtime_gov_survivability_v1",
    "runtime_constitutional_audit_v1",
    "runtime_policy_evolution_gov_v1",
]


@pytest.mark.parametrize("name", _MODULES)
def test_con_stub(name: str) -> None:
    mod = importlib.import_module(f"{_PKG}.{name}")
    r = getattr(mod, f"{name}_stub")(f"con-{name}")
    assert r["integrity_status"] == "ok"
    assert float(r["runtime_confidence"]) > 0

def test_con_artifact() -> None:
    from pathlib import Path

    from app.runtime.runtime_constitution.runtime_constitution_engine_v1 import (
        runtime_constitution_engine_v1,
    )
    runtime_constitution_engine_v1("con-art")
    p = Path("generated/runtime_artifacts/runtime_constitution_v1")
    assert (p / "con-art-constitution.json").is_file()
