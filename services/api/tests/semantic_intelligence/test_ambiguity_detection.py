from app.rules.ambiguity.ambiguity_detector import detect_ambiguities


def test_ambiguity_detection() -> None:
    out = detect_ambiguities("You may and must do this if able.", ["you", "may", "must", "if", "able"])
    assert out["semantic_uncertainty"] >= 0.0
