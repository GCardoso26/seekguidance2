"""runtime_real_replay_engine_v1 — replay operacional."""

from __future__ import annotations

from typing import Any

from app.core.security.redaction import mask_mapping
from app.runtime.runtime_real_replay import store


def runtime_real_replay_engine_v1(
    scope: str,
    *,
    storage_path: str | None = None,
    tenant_id: str = "default",
    action: str = "list",
    replay_id: str | None = None,
    payload: dict[str, Any] | None = None,
    deterministic: bool = True,
    compress: bool = False,
) -> dict[str, Any]:
    store.init_db(storage_path)

    if action == "append" and payload is not None:
        rec = store.append_replay(
            tenant_id,
            scope,
            payload if deterministic else {**payload, "nondeterministic": True},
            storage_path=storage_path,
            compress=compress,
        )
        return _ok(scope, {"action": "append", "record": rec})

    if action == "get" and replay_id:
        rec = store.get_replay(replay_id, storage_path=storage_path)
        if not rec:
            return _fail(scope, "not_found")
        return _ok(scope, {"action": "get", "record": mask_mapping(rec)})

    if action == "export":
        records = [mask_mapping(r) for r in store.export_replays(storage_path=storage_path)]
        return _ok(scope, {"action": "export", "records": records})

    if action == "import" and payload and "records" in payload:
        n = store.import_replays(payload["records"], storage_path=storage_path)
        return _ok(scope, {"action": "import", "imported": n})

    items = store.list_replays(tenant_id, storage_path=storage_path)
    return _ok(
        scope,
        {
            "action": "list",
            "tenant_id": tenant_id,
            "replays": items,
            "deterministic_mode": deterministic,
        },
    )


def _ok(scope: str, extra: dict[str, Any]) -> dict[str, Any]:
    return {
        "scope": scope,
        "assistant_notes": ["runtime_real_replay_engine_v1: replay real."],
        "deterministic_alignment": {"token": f"replay-{scope}"},
        "runtime_confidence": 0.94,
        "replay_summary": extra,
        "lineage_summary": {},
        "divergence_summary": {},
        "governance_summary": {},
        "lifecycle_summary": {},
        "operational_notes": [],
        "integrity_status": "ok",
        **extra,
    }


def _fail(scope: str, code: str) -> dict[str, Any]:
    out = _ok(scope, {"error": code})
    out["integrity_status"] = "degraded"
    return out
