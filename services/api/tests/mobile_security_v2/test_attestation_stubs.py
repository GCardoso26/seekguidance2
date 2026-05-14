from app.mobile_security import (
    replay_attestation_stub,
    runtime_attestation_chain_stub,
    tamper_runtime_v2_stub,
)


def test_security_v2() -> None:
    assert replay_attestation_stub("r1")["replay_summary"]["attested"] is True
    assert tamper_runtime_v2_stub(0)["offline_confidence"] > 0.5


def test_runtime_attestation_chain() -> None:
    out = runtime_attestation_chain_stub(2)
    assert out["replay_summary"]["depth"] == 2
