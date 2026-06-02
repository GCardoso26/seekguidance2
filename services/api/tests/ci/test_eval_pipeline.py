"""Testes do pipeline de avaliação CI (corpus readiness + accuracy@1)."""

from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

import pytest

def _repo_root() -> Path:
    here = Path(__file__).resolve()
    for parent in here.parents:
        if (parent / "scripts" / "ci" / "check_corpus_readiness.py").is_file():
            return parent
    raise FileNotFoundError("repo root (scripts/ci/check_corpus_readiness.py) not found")


ROOT = _repo_root()
SCRIPTS = ROOT / "scripts" / "ci"
API_ROOT = ROOT / "services" / "api"
sys.path.insert(0, str(API_ROOT))


def _load_module(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    mod = importlib.util.module_from_spec(spec)
    sys.modules[name] = mod
    spec.loader.exec_module(mod)
    return mod


check_mod = _load_module("check_corpus_readiness", SCRIPTS / "check_corpus_readiness.py")
eval_mod = _load_module("run_judge_eval", SCRIPTS / "run_judge_eval.py")


def test_corpus_readiness_skips_not_ready():
    ready, skip = check_mod.check_games(
        ["mtg", "pokemon"],
        mock_status={
            "mtg": {"rag_ready": True, "ingestion_job_pending": False},
            "pokemon": {"rag_ready": False, "ingestion_job_pending": True},
        },
    )
    assert "mtg" in ready
    assert "pokemon" in skip


def test_corpus_readiness_skips_pending_ingestion():
    _, skip = check_mod.check_games(
        ["yugioh"],
        mock_status={"yugioh": {"rag_ready": True, "ingestion_job_pending": True}},
    )
    assert "yugioh" in skip


def test_accuracy_at_1_synthetic_hit():
    from evaluation.judge_quality.metrics import score_case, aggregate_results

    results = [
        score_case(
            case_id="t1",
            game_slug="mtg",
            expected_rule="702.19",
            top1_rule="702.19a",
            confidence=0.78,
            n_sources=2,
        ),
        score_case(
            case_id="t2",
            game_slug="mtg",
            expected_rule="405",
            top1_rule="404.1",
            confidence=0.55,
            n_sources=1,
        ),
    ]
    report = aggregate_results(results)
    assert report.games["mtg"].accuracy_at_1 == 0.5
    assert report.games["mtg"].confidence_avg == pytest.approx(0.665, abs=0.01)


def test_gates_exclude_skip_games():
    from evaluation.judge_quality.metrics import EvalReport, GameMetrics, compare_to_baseline

    current = EvalReport(
        games={
            "mtg": GameMetrics("mtg", 0.40, 0.70, 1.0, 2),
            "pokemon": GameMetrics("pokemon", 0.30, 0.40, 1.0, 1),
        }
    )
    baseline = EvalReport(
        games={
            "mtg": GameMetrics("mtg", 0.90, 0.70, 1.0, 2),
            "pokemon": GameMetrics("pokemon", 0.90, 0.70, 1.0, 1),
        }
    )
    ok, failures = compare_to_baseline(current, baseline, indexed_games={"mtg"})
    assert not ok
    assert any("mtg" in f for f in failures)
    assert not any("pokemon" in f for f in failures)
