from app.observability.live_runtime import runtime_entropy_live_stub


def test_runtime_entropy_live() -> None:
    out = runtime_entropy_live_stub("sess-9")
    assert out["layer"] == "runtime_entropy_live"
