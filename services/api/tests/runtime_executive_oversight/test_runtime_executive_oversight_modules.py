"""runtime_executive_oversight."""
from __future__ import annotations

import importlib

import pytest

_PKG = "app.runtime.runtime_executive_oversight"
_MODULES = [
    "runtime_executive_oversight_engine_v1",
    "runtime_council_coordination_v1",
    "runtime_human_supervision_v1",
    "runtime_strategic_intervention_v1",
    "runtime_authority_delegation_v1",
    "runtime_escalation_continuity_v1",
    "runtime_human_review_v1",
    "runtime_accountability_mapping_exec_v1",
    "runtime_sovereignty_balancing_exec_v1",
    "runtime_decision_stewardship_v1",
]


@pytest.mark.parametrize("name", _MODULES)
def test_exe_stub(name: str) -> None:
    mod = importlib.import_module(f"{_PKG}.{name}")
    r = getattr(mod, f"{name}_stub")(f"exe-{name}")
    assert r["integrity_status"] == "ok"
    assert float(r["runtime_confidence"]) > 0

def test_exe_artifact() -> None:
    from pathlib import Path

    from app.runtime.runtime_executive_oversight.runtime_executive_oversight_engine_v1 import (
        runtime_executive_oversight_engine_v1,
    )
    runtime_executive_oversight_engine_v1("exe-art")
    p = Path("generated/runtime_artifacts/executive_oversight_v1")
    assert (p / "exe-art-oversight.json").is_file()
