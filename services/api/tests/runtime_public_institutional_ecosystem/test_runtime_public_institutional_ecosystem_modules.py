"""runtime_public_institutional_ecosystem."""
from __future__ import annotations

import importlib

import pytest

_PKG = "app.runtime.public_runtime_api"
_MODULES = [
    "runtime_public_institutional_ecosystem_engine_v1",
    "runtime_institutional_public_continuity_v1",
    "runtime_multi_year_sdk_survivability_v1",
    "runtime_ecosystem_gov_interop_v1",
    "runtime_public_stewardship_v1",
    "runtime_semantic_continuity_gov_v1",
    "runtime_ecosystem_lifecycle_resilience_v1",
    "runtime_long_term_compat_intel_v1",
    "runtime_adoption_sustainability_v1",
    "runtime_public_fragmentation_prevention_v1",
    "runtime_public_governance_continuity_v1",
]


@pytest.mark.parametrize("name", _MODULES)
def test_pie_stub(name: str) -> None:
    mod = importlib.import_module(f"{_PKG}.{name}")
    r = getattr(mod, f"{name}_stub")(f"pie-{name}")
    assert r["integrity_status"] == "ok"
    assert float(r["runtime_confidence"]) > 0

def test_pie_artifact() -> None:
    from pathlib import Path

    from app.runtime.public_runtime_api.runtime_public_institutional_ecosystem_engine_v1 import (
        runtime_public_institutional_ecosystem_engine_v1,
    )
    runtime_public_institutional_ecosystem_engine_v1("pie-art")
    p = Path("generated/runtime_artifacts/public_institutional_ecosystem_v1")
    assert (p / "pie-art-ecosystem.json").is_file()
