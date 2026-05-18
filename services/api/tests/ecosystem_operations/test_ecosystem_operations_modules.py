"""ecosystem operations stubs."""
from __future__ import annotations

import importlib

import pytest

_PKG = "app.runtime.ecosystem_operations"
_MODULES = [
    "ecosystem_operations_engine_v1",
    "ecosystem_support_registry_v1",
    "ecosystem_release_registry_v1",
    "ecosystem_runtime_health_v1",
    "ecosystem_sdk_registry_v1",
    "ecosystem_client_registry_v1",
    "ecosystem_operational_metrics_v1",
    "ecosystem_adoption_runtime_v1",
    "ecosystem_runtime_feedback_v1",
    "ecosystem_operations_summary_v1",
]


@pytest.mark.parametrize("name", _MODULES)
def test_ecosystem_operations_stub(name: str) -> None:
    mod = importlib.import_module(f"{_PKG}.{name}")
    stub = getattr(mod, f"{name}_stub")
    r = stub(f"eco-{name}")
    assert r["integrity_status"] == "ok"
    assert float(r["runtime_confidence"]) > 0


def test_ecosystem_summary_engine() -> None:
    from app.runtime.ecosystem_operations.ecosystem_operations_summary_v1 import ecosystem_operations_engine_v1

    out = ecosystem_operations_engine_v1("eco-sum")
    assert out["ecosystem_score"] > 0
