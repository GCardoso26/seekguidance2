"""Carrega datasets JSON do diretório `datasets/` e corre métricas."""

from __future__ import annotations

import json
from collections.abc import Iterator
from pathlib import Path
from typing import Any
from uuid import uuid4

from app.evaluation.reasoning_evaluator import evaluate_case
from app.reasoning import run_reasoning_engine
from app.retrieval.types import ChunkHit


def datasets_root() -> Path:
    return Path(__file__).resolve().parents[2] / "datasets"


def iter_json_cases(subdir: str) -> Iterator[dict[str, Any]]:
    root = datasets_root() / subdir
    if not root.is_dir():
        return
    for p in sorted(root.glob("*.json")):
        yield json.loads(p.read_text(encoding="utf-8"))


def _hit_from_stub(stub: dict[str, Any]) -> ChunkHit:
    return ChunkHit(
        chunk_id=uuid4(),
        document_id=uuid4(),
        text=stub.get("text", ""),
        rule_path=stub.get("rule_path"),
        semantic_path=None,
        parent_chunk_id=None,
        hierarchy_level=0,
        document_title=stub.get("document_title", "stub"),
        source_url="https://example.invalid",
        content_sha256=None,
        version_label=None,
        document_content_hash=None,
    )


def run_benchmark_on_disk(game_slug: str = "mtg") -> dict[str, Any]:
    """Avalia todos os JSON em canonical_judge_questions (offline, sem LLM)."""
    scores: list[dict[str, float]] = []
    for case in iter_json_cases("canonical_judge_questions"):
        q = str(case.get("question", ""))
        stubs = case.get("retrieval_stubs") or []
        hits = [_hit_from_stub(s) for s in stubs] if stubs else []
        if not hits and case.get("expected_citations"):
            hits = [
                _hit_from_stub({"rule_path": c, "text": "stub", "document_title": "CR"})
                for c in (case.get("expected_citations") or [])[:4]
            ]
        if not hits:
            hits = [
                _hit_from_stub(
                    {
                        "rule_path": "synthetic",
                        "text": f"{q} replacement state-based trigger priority segoc chain mandatory simultaneous",
                        "document_title": "synthetic",
                    }
                )
            ]
        slug = str(case.get("game", game_slug))
        report = run_reasoning_engine(q, hits, slug, settings=None).to_api_dict()
        scores.append(evaluate_case(case, report))
    if not scores:
        return {"n": 0, "mean": {}}
    keys = scores[0].keys()
    mean = {k: sum(s[k] for s in scores) / len(scores) for k in keys}
    return {"n": len(scores), "mean": mean, "samples": scores}
