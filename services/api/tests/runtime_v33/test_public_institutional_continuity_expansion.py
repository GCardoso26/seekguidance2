"""PIC expansion."""
import importlib

import pytest

_MODS = [
    "runtime_public_ecosystem_continuity_v1",
    "runtime_multiversion_longitudinal_compat_v1",
    "runtime_public_api_stability_v1",
    "runtime_public_evolutionary_governance_v1",
    "runtime_adoption_continuity_v1",
    "runtime_public_semantic_continuity_v1",
    "runtime_long_horizon_public_interop_v1",
    "runtime_public_governance_evolution_v1",
    "runtime_public_compat_resilience_v1",
    "runtime_institutional_public_stewardship_v1",
]


@pytest.mark.parametrize("name", _MODS)
def test_pic_expansion(name: str) -> None:
    mod = importlib.import_module(f"app.runtime.public_runtime_api.{name}")
    r = getattr(mod, f"{name}_stub")(f"pic2-{name}")
    assert r["integrity_status"] == "ok"
    assert float(r["runtime_confidence"]) >= 0.9
