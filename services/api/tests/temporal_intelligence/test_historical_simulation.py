from app.reasoning.temporal.historical_state_simulation import historical_state


def test_historical_simulation() -> None:
    out = historical_state("2009")
    assert out["period"] == "2009"
