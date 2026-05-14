"""Consistência de execução."""

from __future__ import annotations

from app.evaluation.runtime.execution_consistency import execution_pairwise_match


def test_pairwise_match() -> None:
    assert execution_pairwise_match(["a", "b"], ["a", "b"])
    assert not execution_pairwise_match(["a"], ["a", "b"])
