from app.observability.live_runtime import mobile_runtime_costs_v2_stub


def test_runtime_costs_v2() -> None:
    assert mobile_runtime_costs_v2_stub(0.12)["usd_estimate"] == 0.12
