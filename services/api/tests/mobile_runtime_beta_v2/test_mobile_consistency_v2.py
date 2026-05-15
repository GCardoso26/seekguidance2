"""Mobile consistency v2."""

from __future__ import annotations

from app.mobile_runtime import mobile_runtime_consistency_v2_stub


def test_mobile_consistency_v2() -> None:
    p = mobile_runtime_consistency_v2_stub("dev-p3")
    assert p["mobile_consistency_score"] > 0
