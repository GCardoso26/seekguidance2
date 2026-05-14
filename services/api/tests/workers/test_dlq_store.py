"""DLQ store."""

from __future__ import annotations

from dlq_store import DlqStore, poison_message_heuristic


def test_dlq_memory_roundtrip() -> None:
    q = DlqStore(redis=None, key_prefix="t")
    q.push("ingest", {"job_id": "1", "err": "x"})
    rows = q.peek("ingest", limit=5)
    assert rows and rows[0]["payload"]["job_id"] == "1"


def test_poison() -> None:
    assert poison_message_heuristic({}) is True
