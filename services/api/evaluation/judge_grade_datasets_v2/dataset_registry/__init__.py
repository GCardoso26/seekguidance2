"""Registo de datasets executáveis."""

from __future__ import annotations

from typing import Any


def dataset_registry_lookup_stub(dataset_id: str) -> dict[str, Any]:
    return {"dataset_id": dataset_id, "registered": True, "replay_refs_required": True}
