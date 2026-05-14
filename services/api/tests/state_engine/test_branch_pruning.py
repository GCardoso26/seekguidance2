"""Poda de ramos."""

from app.reasoning.branching.branch_pruner import generate_candidate_paths, prune_paths


def test_prune_caps_paths() -> None:
    paths = [["a"], ["b"], ["c"], ["d"], ["e"]]
    kept, stats = prune_paths(paths, max_paths=2, max_depth=10)
    assert len(kept) == 2
    assert stats["kept"] == 2


def test_generate_candidate_two_replacement() -> None:
    roles = ["event", "replacement", "sba"]
    c = generate_candidate_paths(roles, "What if two replacement effects modify the same event?", max_branches=4)
    assert len(c) >= 1
