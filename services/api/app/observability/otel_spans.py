"""Metadados de spans OTEL (API interna — export real via collector)."""

from __future__ import annotations

from typing import Any


def span_attributes(*, operation: str, game_slug: str | None = None) -> dict[str, Any]:
    attrs: dict[str, Any] = {"tcg.operation": operation}
    if game_slug:
        attrs["tcg.game"] = game_slug
    return attrs


def trace_context_stub(trace_id: str | None = None) -> dict[str, Any]:
    return {"trace_id": trace_id or "unset", "otel": "attributes_only"}
