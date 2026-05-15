"""Reconciliação de replay."""

from __future__ import annotations

from app.runtime.persistent_replay_runtime.replay_reconciliation_service import replay_reconciliation_service_stub


def test_reconciliation_service() -> None:
    r = replay_reconciliation_service_stub("x1")
    assert isinstance(r, dict)
