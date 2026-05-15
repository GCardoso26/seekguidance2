"""Production runtime v11 operational mode."""
from __future__ import annotations

from app.runtime.production_runtime_v11.runtime_real_operational_mode_v1 import (
    runtime_real_operational_mode_engine_v1,
)


def test_operational_mode_engine() -> None:
    r = runtime_real_operational_mode_engine_v1("om20-m")
    assert r["operational_score"] > 0
    assert r["mode"]
