"""Operational certification stub sweep."""
from __future__ import annotations

from app.runtime.production_certification.runtime_operational_chaos_engine_v2 import (
    runtime_operational_chaos_engine_v2_stub,
)
from app.runtime.production_certification.runtime_operational_soak_engine_v2 import (
    runtime_operational_soak_engine_v2_stub,
)


def test_soak_v2() -> None:
    assert runtime_operational_soak_engine_v2_stub("c")["certification_score"] > 0


def test_chaos_v2() -> None:
    assert runtime_operational_chaos_engine_v2_stub("c")["certification_score"] > 0
