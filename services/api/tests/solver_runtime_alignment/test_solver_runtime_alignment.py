from app.verification.formal_solver_v6 import deterministic_solver_alignment_v6_payload


def test_solver_runtime_alignment() -> None:
    payload = deterministic_solver_alignment_v6_payload("hash-a", "hash-b")
    assert "assistant_notes" in payload
