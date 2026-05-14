"""SQLite — persistência local de replay (stub operacional)."""

from __future__ import annotations

from typing import Any

from app.mobile_runtime._judge_mobile_payload import attach_storage_operational_fields, judge_mobile_core_payload


def sqlite_runtime_stub(db_path: str) -> dict[str, Any]:
    base = judge_mobile_core_payload(
        replay_summary={"engine": "sqlite", "path_token": db_path[-16:], "wal": True},
        sync_hints=["VACUUM incremental em janelas de idle.", "Checkpoint antes de resume."],
        deterministic_alignment={"schema_version": "sqlite-replay-v0"},
        mobile_constraints={"max_db_mb_soft": 256},
        offline_confidence=0.74,
        assistant_notes=[
            "Persistência local; lineage completo pode exigir cloud opcional.",
            "Juiz humano mantém ruling final.",
        ],
        lineage_replay_slice="sqlite-v0",
    )
    return attach_storage_operational_fields(
        base,
        storage_status={"writable": True, "pages_dirty": 2},
        integrity_status={"pragma_integrity": "ok"},
        replay_alignment={"head_slice": "slice-local", "remote_anchor": None},
        lineage_snapshot={"depth": 4, "hash": "ln-sqlite"},
        offline_constraints=["Sem replicação multi-master", "Sem merge automático de ruling"],
    )
