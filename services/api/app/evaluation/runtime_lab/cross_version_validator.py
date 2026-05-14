"""Validação cruzada de versões (replay)."""

from __future__ import annotations

from typing import Any

from app.replay_distributed.cross_version_replay import map_event_cross_version


def validate_cross_version_sample(ev: dict[str, Any]) -> dict[str, Any]:
    return {"mapped": map_event_cross_version(ev, "target_v2")}
