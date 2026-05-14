"""Worker maturity modules."""

from __future__ import annotations

import time

from adaptive_worker_scaling import adaptive_worker_replicas
from dead_letter_recovery import recover_dlq_peek
from dlq_store import DlqStore
from queue_backpressure import queue_backpressure_signal
from replay_queue_compaction import compact_replay_queue_ids
from semantic_priority_scheduler import schedule_semantic_jobs
from worker_health_monitor import worker_health_snapshot


def test_backpressure() -> None:
    s = queue_backpressure_signal(100, soft_limit=50, hard_limit=200)
    assert s["level"] == "soft"


def test_health() -> None:
    now = time.time()
    h = worker_health_snapshot(last_beat_ts=now, now=now, queue_depth=0)
    assert h["heartbeat_ok"] is True


def test_replay_queue_compact() -> None:
    assert compact_replay_queue_ids(["a", "a", "b"], max_unique=2) == ["a", "b"]


def test_semantic_schedule() -> None:
    jobs = [{"job_id": "b", "priority": 1}, {"job_id": "a", "priority": 2}]
    out = schedule_semantic_jobs(jobs)
    assert out[0]["job_id"] == "a"


def test_dlq_recover() -> None:
    store = DlqStore(redis=None, key_prefix="t")
    store.push("q", {"job_id": "1", "url": "http://x"})
    peek = recover_dlq_peek(store, "q", limit=5)
    assert len(peek) == 1


def test_adaptive_workers() -> None:
    assert adaptive_worker_replicas(100, per_worker_capacity=25) == 4
