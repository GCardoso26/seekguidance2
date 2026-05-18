"""test_certification_governance_modules.py."""
import importlib

import pytest

_PKG = "app.runtime.runtime_certification_governance"
_MODULES = [
    "runtime_certification_governance_engine_v1",
    "runtime_cert_gov_scoring_v1",
    "runtime_cert_gov_forecasting_v1",
    "runtime_cert_gov_governance_v1",
    "runtime_cert_gov_registry_v1",
    "runtime_cert_gov_heuristics_v1",
    "runtime_cert_gov_balancing_v1",
    "runtime_cert_gov_sustainability_v1",
    "runtime_cert_gov_convergence_v1",
    "runtime_certification_governance_summary_v1",
]


@pytest.mark.parametrize("name", _MODULES)
def test_cgo_stub(name: str) -> None:
    mod = importlib.import_module(f"{_PKG}.{name}")
    r = getattr(mod, f"{name}_stub")(f"cgo-{name}")
    assert r["integrity_status"] == "ok"
