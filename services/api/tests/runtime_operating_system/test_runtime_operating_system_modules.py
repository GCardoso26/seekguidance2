"""runtime_operating_system."""
from __future__ import annotations

import importlib

import pytest

_PKG = "app.runtime.runtime_operating_system"
_MODULES = [
    "canonical_runtime_operating_system_engine_v1",
    "runtime_os_capability_graph_v1",
    "runtime_os_topology_v1",
    "runtime_os_dependency_map_v1",
    "runtime_os_lifecycle_orchestration_v1",
    "runtime_os_state_propagation_v1",
    "runtime_os_convergence_scoring_v1",
    "runtime_os_simplification_scoring_v1",
    "runtime_os_unified_summary_v1",
]


@pytest.mark.parametrize("name", _MODULES)
def test_ros_stub(name: str) -> None:
    mod = importlib.import_module(f"{_PKG}.{name}")
    fn = getattr(mod, f"{name}_stub", None)
    if fn is None and name.endswith("_engine_v1"):
        fn = getattr(mod, name)
    elif fn is None:
        fn = getattr(mod, f"{name}_stub")
    r = fn(f"ros-{name}")
    assert r["integrity_status"] == "ok"
    assert float(r["runtime_confidence"]) > 0

def test_ros_os_artifact() -> None:
    from pathlib import Path

    from app.runtime.runtime_operating_system.canonical_runtime_operating_system_engine_v1 import (
        canonical_runtime_operating_system_engine_v1,
    )
    canonical_runtime_operating_system_engine_v1("ros-art")
    assert (Path("generated/runtime_artifacts/runtime_operating_system_v1/ros-art-os.json")).is_file()
