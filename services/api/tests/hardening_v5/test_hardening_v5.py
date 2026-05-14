from app.games.hardening_v5 import normalization_leak_diagnostics_v5_stub


def test_hardening_v5_stub() -> None:
    out = normalization_leak_diagnostics_v5_stub(["a"])
    assert out["normalization_leak_diagnostics"]["count"] == 1
