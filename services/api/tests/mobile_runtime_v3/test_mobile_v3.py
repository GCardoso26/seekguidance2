"""Mobile runtime v3."""

from __future__ import annotations

from app.mobile_runtime.mobile_runtime_federation import mobile_runtime_federation_stub


def test_mobile_federation() -> None:
    m = mobile_runtime_federation_stub("d1")
    assert m["scope"] == "d1"
