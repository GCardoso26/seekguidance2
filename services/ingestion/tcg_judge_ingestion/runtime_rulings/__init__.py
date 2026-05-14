"""Rulings materializados para runtime."""

from __future__ import annotations

from typing import Any


def materialize_runtime_ruling(record: dict[str, Any]) -> dict[str, Any]:
    return {"ruling_id": record.get("ruling_id"), "ready": bool(record.get("executable"))}
