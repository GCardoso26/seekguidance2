"""Alinhamento temporal de rulings (timestamps normalizados)."""

from __future__ import annotations

from typing import Any


def align_ruling_timestamps(records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return sorted(records, key=lambda r: (r.get("effective_at") or "", r.get("ruling_id") or ""))
