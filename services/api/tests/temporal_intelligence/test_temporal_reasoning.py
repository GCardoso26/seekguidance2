from app.reasoning.temporal.temporal_reasoner import run_temporal_reasoning


def test_temporal_reasoning_period_detection() -> None:
    out = run_temporal_reasoning("What was the SBA behavior in 2009?", "mtg")
    assert out["historical_period"] == "2009"
