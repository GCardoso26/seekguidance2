"""Testes replay real."""
from __future__ import annotations

from pathlib import Path

import pytest
from app.runtime.runtime_real_replay.engine import runtime_real_replay_engine_v1


@pytest.fixture
def replay_db(tmp_path: Path) -> str:
    return str(tmp_path / "replay.sqlite")


def test_replay_append_and_get(replay_db: str) -> None:
    r = runtime_real_replay_engine_v1(
        "scope-a",
        storage_path=replay_db,
        tenant_id="t1",
        action="append",
        payload={"event": "test"},
    )
    rid = r["record"]["replay_id"]
    got = runtime_real_replay_engine_v1(
        "scope-a",
        storage_path=replay_db,
        action="get",
        replay_id=rid,
    )
    assert got["record"]["integrity_ok"] is True


def test_replay_export_import(replay_db: str) -> None:
    runtime_real_replay_engine_v1(
        "s",
        storage_path=replay_db,
        tenant_id="t1",
        action="append",
        payload={"n": 1},
    )
    exp = runtime_real_replay_engine_v1("s", storage_path=replay_db, action="export")
    n = runtime_real_replay_engine_v1(
        "s",
        storage_path=replay_db,
        action="import",
        payload={"records": exp["records"]},
    )
    assert n["imported"] >= 1
