"""runtime_operational_release_summary_v1 — resumo RC de execução."""

from __future__ import annotations

from typing import Any

from app.runtime.production_runtime.runtime_operational_controller_v1 import (
    operational_snapshot,
    runtime_operational_controller_v1_stub,
)


def runtime_operational_release_summary_v1_stub(
    scope: str,
    *,
    storage_path: str | None = None,
) -> dict[str, Any]:
    snap = operational_snapshot(scope)
    base = runtime_operational_controller_v1_stub(scope, storage_path=storage_path)
    base["release_summary"] = {
        "stability": snap["stability_score"],
        "ready": snap["stability_score"] > 0.75 and not snap["degraded_execution"],
    }
    return base
