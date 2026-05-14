"""Orquestração de filas."""

from __future__ import annotations

from orchestration_runtime import DEFAULT_QUEUES, queue_starvation_hint, worker_heartbeat_ok


def test_starvation() -> None:
    out = queue_starvation_hint({"ingestion": 0, "replay": 5})
    assert "ingestion" in out["starving"]


def test_heartbeat() -> None:
    import time

    assert worker_heartbeat_ok(time.time(), time.time()) is True


def test_default_queues_sorted() -> None:
    priorities = [q.priority for q in DEFAULT_QUEUES]
    assert priorities == sorted(priorities, reverse=True)
