"""collective equilibrium — meta operational alignment."""
import importlib

import pytest

_PKG = "app.runtime.runtime_meta_operational_alignment"
_MODULES = [
    "runtime_collective_equilibrium_engine_v1",
    "runtime_meta_equilibrium_bridge_v1",
]


@pytest.mark.parametrize("name", _MODULES)
def test_ceq_stub(name: str) -> None:
    mod = importlib.import_module(f"{_PKG}.{name}")
    r = getattr(mod, f"{name}_stub")(f"ceq-{name}")
    assert r["integrity_status"] == "ok"
    assert float(r["runtime_confidence"]) > 0


def test_ceq_engine_score() -> None:
    fn = importlib.import_module(
        "app.runtime.runtime_meta_operational_alignment.runtime_collective_equilibrium_engine_v1"
    ).runtime_collective_equilibrium_engine_v1
    assert fn("ceq-eng")["collective_equilibrium_score"] > 0
