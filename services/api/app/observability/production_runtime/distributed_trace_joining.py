"""Junção de partes de trace distribuído."""

from __future__ import annotations

from typing import Any


def join_trace_parts(parts: list[dict[str, Any]]) -> dict[str, Any]:
    ids = [p.get("trace_id") for p in parts if p.get("trace_id")]
    return {"joined": len(set(ids)) <= 1, "trace_ids": ids}
