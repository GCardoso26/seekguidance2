"""Bridge Realm mobile para replay (stub, sem SDK obrigatório)."""

from __future__ import annotations

from typing import Any

from app.runtime.persistent_replay_runtime.contracts import StorageDialect


def replay_storage_realm_bridge_stub(device_id: str) -> dict[str, Any]:
    return {
        "device_id": device_id,
        "dialect": StorageDialect.REALM.value,
        "consistency_summary": {"mobile_migration_safe": True},
        "assistant_notes": ["replay_storage_realm_bridge: compactação assistida; explainability-first."],
    }
