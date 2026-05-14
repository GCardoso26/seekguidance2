from app.testing.property_based.property_assertions import assert_property_suite


def test_property_validation() -> None:
    out = assert_property_suite({"deterministic": True, "legality": True})
    assert out["passed"] is True
