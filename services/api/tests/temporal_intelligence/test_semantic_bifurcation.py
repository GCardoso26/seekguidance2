from app.evolution.bifurcation_detector import bifurcation_detected


def test_semantic_bifurcation() -> None:
    assert bifurcation_detected(0.2, 1) is True
