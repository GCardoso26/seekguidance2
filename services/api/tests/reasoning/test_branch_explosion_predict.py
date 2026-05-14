"""Branch explosion predict."""

from __future__ import annotations

from app.reasoning.branching.explosion_predict import predict_branch_explosion


def test_predict() -> None:
    paths = [["a"], ["b"], ["c"], ["d"], ["e"]]
    out = predict_branch_explosion(paths, max_paths=2, max_depth=4)
    assert out["kept"] == 2
