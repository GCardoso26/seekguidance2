"""FRES expansion."""
import importlib

import pytest

_MODS = [
    "runtime_fres_scoring_v1",
    "runtime_fres_forecasting_v1",
    "runtime_fres_governance_v1",
    "runtime_fres_registry_v1",
    "runtime_fres_heuristics_v1",
    "runtime_fres_balancing_v1",
    "runtime_fres_sustainability_v1",
    "runtime_fres_convergence_v1",
]


@pytest.mark.parametrize("name", _MODS)
def test_fres_expansion(name: str) -> None:
    mod = importlib.import_module(f"app.runtime.runtime_future_resilience.{name}")
    r = getattr(mod, f'{name}_stub')(f'fres2-{name}')
    assert r["future_resilience_score"] == 0.94
