"""operational_ux_ga."""
from __future__ import annotations

from app.runtime.product_runtime.runtime_operational_portal_v2 import runtime_operational_portal_v2_stub


def test_operational_ux_ga_imports() -> None:
    r = runtime_operational_portal_v2_stub("ga30-x")
    assert r["runtime_confidence"] > 0
