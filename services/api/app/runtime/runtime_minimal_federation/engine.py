"""runtime_minimal_federation_engine_v1."""

from __future__ import annotations

from typing import Any

from app.runtime.runtime_minimal_federation import registry


def runtime_minimal_federation_engine_v1(
    scope: str,
    *,
    storage_path: str | None = None,
    action: str = "status",
    node_id: str | None = None,
    endpoint: str | None = None,
) -> dict[str, Any]:
    registry.init_db(storage_path)
    if action == "register" and node_id and endpoint:
        rec = registry.register_node(node_id, endpoint, storage_path=storage_path)
        return _ok(scope, {"registered": rec})
    if action == "heartbeat" and node_id:
        ok = registry.heartbeat(node_id, storage_path=storage_path)
        return _ok(scope, {"heartbeat": ok, "node_id": node_id})
    nodes = registry.list_nodes(storage_path=storage_path)
    healthy = sum(1 for n in nodes if n.get("alive"))
    return _ok(
        scope,
        {
            "nodes": nodes,
            "healthy_count": healthy,
            "sync_mode": "basic",
            "replay_propagation": "simple",
        },
    )


def _ok(scope: str, extra: dict[str, Any]) -> dict[str, Any]:
    return {
        "scope": scope,
        "assistant_notes": ["runtime_minimal_federation_engine_v1: federation minimal."],
        "deterministic_alignment": {"token": f"fed-{scope}"},
        "runtime_confidence": 0.94,
        "replay_summary": {},
        "lineage_summary": {},
        "divergence_summary": {},
        "governance_summary": {},
        "lifecycle_summary": {},
        "operational_notes": [],
        "integrity_status": "ok",
        **extra,
    }
