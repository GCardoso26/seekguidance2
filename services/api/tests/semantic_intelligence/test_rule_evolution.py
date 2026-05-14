from app.rules.evolution.rule_evolution_tracker import track_rule_evolution


def test_rule_evolution() -> None:
    out = track_rule_evolution({"a": 1}, {"a": 2})
    assert "semantic_behavior_change" in out
    assert "runtime_semantic_stability" in out
