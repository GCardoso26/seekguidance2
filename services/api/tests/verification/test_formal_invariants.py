from app.verification.formal_assertions import assert_formal_invariants


def test_formal_invariants_pass() -> None:
    out = assert_formal_invariants(constraints_ok=True, precedence_ok=True, mutations_ok=True)
    assert out["verification_passed"] is True
