from app.mobile_runtime.observability import mobile_observability_stub


def test_mobile_observability() -> None:
    assert mobile_observability_stub(True)["battery_low"] is True
