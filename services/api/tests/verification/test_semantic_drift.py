from app.verification.drift.semantic_drift_detector import detect_semantic_drift


def test_semantic_drift_detected() -> None:
    out = detect_semantic_drift("603.3b", "old", "new", 0.1)
    assert out["version_change_detected"] is True
    assert out["semantic_regression_risk"] >= 0.03
