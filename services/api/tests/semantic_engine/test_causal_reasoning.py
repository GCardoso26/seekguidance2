"""Causalidade básica."""

from app.reasoning.causal.causal_chain_builder import build_causal_chain_from_roles


def test_causal_chain_follows_roles() -> None:
    roles = ["event", "replacement", "sba"]
    chain = build_causal_chain_from_roles(roles, "cleanup")
    assert chain
    assert any("replacement" in str(c).lower() or "replacement" in str(c.get("event", "")).lower() for c in chain)
