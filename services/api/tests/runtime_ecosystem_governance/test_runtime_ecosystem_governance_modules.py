"""runtime_ecosystem_governance."""
from __future__ import annotations

import importlib

import pytest

_PKG = "app.runtime.runtime_ecosystem_governance"
_MODULES = [
    "runtime_ecosystem_governance_engine_v1",
    "runtime_sdk_governance_v1",
    "runtime_public_api_lifecycle_v1",
    "runtime_semantic_version_lineage_v1",
    "runtime_compatibility_policy_v1",
    "runtime_migration_readiness_v1",
    "runtime_fragmentation_detection_v1",
    "runtime_adapter_lifecycle_v1",
    "runtime_capability_compatibility_matrix_v1",
    "runtime_enterprise_extension_governance_v1",
]


@pytest.mark.parametrize("name", _MODULES)
def test_ecogov_stub(name: str) -> None:
    mod = importlib.import_module(f"{_PKG}.{name}")
    fn = getattr(mod, f"{name}_stub", None)
    if fn is None and name.endswith("_engine_v1"):
        fn = getattr(mod, name)
    elif fn is None:
        fn = getattr(mod, f"{name}_stub")
    r = fn(f"ecogov-{name}")
    assert r["integrity_status"] == "ok"
    assert float(r["runtime_confidence"]) > 0
