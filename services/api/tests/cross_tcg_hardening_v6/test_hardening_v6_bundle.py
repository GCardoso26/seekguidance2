from app.games.hardening_v6 import soft_equivalence_validation_v6_stub, yugioh_runtime_divergence_v6_stub


def test_hardening_v6_soft_equivalence() -> None:
    assert soft_equivalence_validation_v6_stub()["replay_summary"]["strong_equivalence"] is False
    assert yugioh_runtime_divergence_v6_stub(0.5)["tcg"] == "yugioh"
