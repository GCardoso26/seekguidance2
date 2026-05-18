"""public_ecosystem_stability_v3."""
from __future__ import annotations

import importlib

import pytest

_PKG = "app.runtime.public_runtime_api"
_MODULES = [
    "runtime_public_ecosystem_stability_engine_v3",
    "runtime_ecosystem_stability_forecast_v3",
    "runtime_sdk_survivability_v3",
    "runtime_semantic_release_continuity_v3",
    "runtime_compatibility_lifecycle_v3",
    "runtime_public_api_sustainability_v3",
    "runtime_adapter_resilience_forecast_v3",
    "runtime_fragmentation_mitigation_v3",
    "runtime_long_horizon_compat_v3",
    "runtime_ecosystem_operational_maturity_v3",
]


@pytest.mark.parametrize("name", _MODULES)
def test_pubstab_stub(name: str) -> None:
    mod = importlib.import_module(f"{_PKG}.{name}")
    r = getattr(mod, f"{name}_stub")(f"pubstab-{name}")
    assert r["integrity_status"] == "ok"
    assert float(r["runtime_confidence"]) > 0
