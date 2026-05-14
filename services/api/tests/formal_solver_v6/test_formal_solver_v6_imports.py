from app.verification.formal_solver_v6 import operational_legality_runtime_payload


def test_formal_solver_v6_exports_payload() -> None:
    payload = operational_legality_runtime_payload("case_x")
    assert "legality_reasoning" in payload
    assert "assistant_notes" in payload
