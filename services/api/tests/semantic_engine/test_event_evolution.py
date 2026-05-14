"""Pipeline V6."""

from app.reasoning.semantic_v6_pipeline import run_semantic_gameplay_v6


def test_v6_runs() -> None:
    v6 = run_semantic_gameplay_v6(
        validated_roles=["event", "replacement", "sba"],
        question="cleanup replacement SBA",
        game_slug="mtg",
        v5_deterministic_confidence=0.9,
    )
    assert v6.causal_chain
    assert isinstance(v6.deterministic_confidence, float)
