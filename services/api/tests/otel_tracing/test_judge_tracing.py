"""Judge tracing metrics."""

from app.runtime.runtime_judge_tracing.tracer import (
    JudgeTraceContext,
    judge_metrics_snapshot,
    record_judge_phase,
    record_judge_request,
)


def test_record_judge_request() -> None:
    record_judge_request(game_slug="mtg", confidence=0.8, cache_hit=True, n_chunks=5)
    snap = judge_metrics_snapshot()
    assert snap["judge_requests_total"] >= 1
    assert snap["judge_cache_hit_rate"] >= 0


def test_judge_span_context() -> None:
    ctx = JudgeTraceContext(trace_id="t1", game_slug="mtg", query_length=10)
    assert ctx.to_attrs()["game_slug"] == "mtg"


def test_record_phase() -> None:
    record_judge_phase("retrieval", 0.5)
    snap = judge_metrics_snapshot()
    assert "retrieval" in snap["judge_phase_duration_seconds"]
