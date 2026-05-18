"""runtime_public_longevity."""
from __future__ import annotations

import importlib

import pytest

_PKG = "app.runtime.public_runtime_api"
_MODULES = [
    "runtime_public_longevity_engine_v1",
    "runtime_sdk_lifecycle_survivability_v1",
    "runtime_public_ecosystem_continuity_v1",
    "runtime_semantic_version_survivability_v1",
    "runtime_compat_continuity_v1",
    "runtime_fragmentation_resistance_v1",
    "runtime_adapter_lifecycle_gov_v1",
    "runtime_release_survivability_forecast_v1",
    "runtime_ecosystem_continuity_score_v1",
    "runtime_api_sustainability_long_v1",
]


@pytest.mark.parametrize("name", _MODULES)
def test_publo_stub(name: str) -> None:
    mod = importlib.import_module(f"{_PKG}.{name}")
    r = getattr(mod, f"{name}_stub")(f"publo-{name}")
    assert r["integrity_status"] == "ok"
    assert float(r["runtime_confidence"]) > 0

def test_publo_artifact() -> None:
    from pathlib import Path

    from app.runtime.public_runtime_api.runtime_public_longevity_engine_v1 import (
        runtime_public_longevity_engine_v1,
    )
    runtime_public_longevity_engine_v1("publo-art")
    assert (Path("generated/runtime_artifacts/public_ecosystem_longevity_v1/publo-art-longevity.json")).is_file()
