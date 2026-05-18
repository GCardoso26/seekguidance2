"""PEE expansion."""
import importlib

import pytest

_MODS = [
    "runtime_public_evolution_continuity_v1",
    "runtime_multi_version_survivability_gov_v1",
    "runtime_ecosystem_migration_intel_v1",
    "runtime_compat_evolution_balancing_v1",
    "runtime_lh_public_interoperability_v1",
    "runtime_ecosystem_adaptation_gov_v1",
    "runtime_semantic_continuity_enforcement_v1",
    "runtime_distributed_ecosystem_survivability_v1",
    "runtime_public_continuity_resilience_v1",
    "runtime_adoption_evolution_coord_v1",
]


@pytest.mark.parametrize("name", _MODS)
def test_pee_expansion(name: str) -> None:
    mod = importlib.import_module(f"app.runtime.public_runtime_api.{name}")
    r = getattr(mod, f'{name}_stub')(f'pee2-{name}')
    assert r["public_evolutionary_ecosystem_score"] == 0.94
