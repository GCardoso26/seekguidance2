"""Corpus executável e confiança V2."""

from __future__ import annotations

from tcg_judge_ingestion.corpus_confidence_v2 import corpus_confidence_v2
from tcg_judge_ingestion.corpus_indexing import build_corpus_index_bundle
from tcg_judge_ingestion.cross_version_resolution import cross_version_resolution_diff
from tcg_judge_ingestion.executable_corpus import (
    build_executable_ruling_record,
    semantic_replay_index_stub,
    structured_replay_timeline,
    version_to_version_legality_diff,
)
from tcg_judge_ingestion.historical_resolution_paths import historical_resolution_path
from tcg_judge_ingestion.runtime_rulings import materialize_runtime_ruling


def test_executable_ruling() -> None:
    r = build_executable_ruling_record(
        "r1",
        legality_expectations=["L1"],
        timing_expectations=["T1"],
        replay_expectations=["P1"],
        deterministic_paths=["D1"],
    )
    assert r["executable"] is True


def test_semantic_index() -> None:
    s = semantic_replay_index_stub([{"replay_key": "a"}, {"replay_key": "b"}])
    assert s["indexed"] == 2


def test_structured_replay() -> None:
    t = structured_replay_timeline([{"tick": 2}, {"tick": 1}])
    assert t["timeline_ticks"] == [1, 2]


def test_version_diff() -> None:
    assert version_to_version_legality_diff("v1", "v2")["status"] == "pending_semantic_diff"


def test_resolution_path() -> None:
    assert historical_resolution_path([("a", "b")]) == ["a", "b"]


def test_cross_version_resolution() -> None:
    d = cross_version_resolution_diff({"x": 1}, {"x": 2})
    assert "x" in d


def test_materialize() -> None:
    m = materialize_runtime_ruling({"ruling_id": "z", "executable": True})
    assert m["ready"] is True


def test_confidence_v2() -> None:
    c = corpus_confidence_v2(
        judge_confidence=0.9,
        archive_reliability=0.9,
        replay_reproducibility=0.9,
        contradiction_density=0.1,
        semantic_ambiguity=0.1,
        cross_version_stability=0.9,
    )
    assert c["score"] > 0.8


def test_index_bundle() -> None:
    b = build_corpus_index_bundle(
        semantic_replay=1,
        ontology=2,
        temporal_lineage=3,
        contradiction=4,
        multiplayer=5,
    )
    assert b["multiplayer"] == 5
