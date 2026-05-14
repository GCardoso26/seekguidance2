"""Efeitos IR."""

from __future__ import annotations

from typing import Any


def generated_effect_event(name: str, payload: dict[str, Any] | None = None) -> dict[str, Any]:
    return {"event_class": name, "payload": dict(payload or {})}
