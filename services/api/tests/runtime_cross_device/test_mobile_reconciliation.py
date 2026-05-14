from app.mobile_runtime.mobile_runtime_reconciliation import mobile_runtime_reconciliation_stub


def test_mobile_runtime_reconciliation() -> None:
    out = mobile_runtime_reconciliation_stub("slice-1")
    assert out["replay_confidence"] > 0.5
    assert "reconciliation_notes" in out
