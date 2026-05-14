from __future__ import annotations

from tcg_judge_ingestion.ingestion_orchestrator.plan import build_ingestion_plan
from tcg_judge_ingestion.parsers.registry import extract_for_game
from tcg_judge_ingestion.validation.semantic_validation import semantic_coverage_score


def test_build_ingestion_plan_mtg() -> None:
    plan = build_ingestion_plan("mtg")
    assert any("magic.wizards.com" in p["url"] for p in plan)


def test_extract_unknown_game_empty() -> None:
    out = extract_for_game("unknown_game_xyz", "hello")
    assert out["timing"] == []


def test_extract_ygo_chain() -> None:
    out = extract_for_game("yugioh", "build a chain and segoc")
    assert "chain" in out["chain_stack_semantics"] or "segoc" in out["timing"]


def test_semantic_coverage_score() -> None:
    fields = {"timing": ["a"], "windows": [], "constraints": [], "dependencies": []}
    assert semantic_coverage_score(fields) == 0.25
