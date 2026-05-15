"""Mobile beta sync v2."""

from __future__ import annotations

from app.mobile_runtime import mobile_runtime_beta_sync_stub


def test_beta_sync() -> None:
    p = mobile_runtime_beta_sync_stub("dev-2")
    assert p["replay_summary"] is not None
