from app.mobile_runtime import mobile_runtime_reconciliation_v2_stub


def test_reconciliation_v2_stub() -> None:
    out = mobile_runtime_reconciliation_v2_stub("z9")
    assert "deterministic_alignment" in out
