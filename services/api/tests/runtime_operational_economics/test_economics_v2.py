"""operational economics v2."""
from app.runtime.production_sustainability.runtime_operational_economics_engine_v2 import (
    runtime_operational_economics_engine_v2,
)


def test_economics_v2() -> None:
    assert runtime_operational_economics_engine_v2("econ2")["economics_score"] > 0
