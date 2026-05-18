"""ALG expansion via submodule import."""
import importlib

import pytest

_MODS = [
    "runtime_long_term_arch_survivability_v1",
    "runtime_entropy_aware_stabilization_v1",
    "runtime_ecosystem_structural_longevity_v1",
    "runtime_gov_continuity_resilience_v1",
    "runtime_semantic_arch_preservation_v1",
    "runtime_adaptive_ecosystem_stabilization_v1",
    "runtime_compat_longevity_balancing_v1",
    "runtime_lifecycle_entropy_reduction_v1",
    "runtime_distributed_arch_continuity_v1",
    "runtime_operational_sustainability_convergence_v1",
]


@pytest.mark.parametrize("name", _MODS)
def test_alg_expansion(name: str) -> None:
    mod = importlib.import_module(f"app.runtime.runtime_consolidation.{name}")
    r = getattr(mod, f'{name}_stub')(f'algx-{name}')
    assert r["integrity_status"] == "ok"
