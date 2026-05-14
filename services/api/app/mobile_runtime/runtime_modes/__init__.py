"""Modos de runtime: offline, híbrido, cloud opcional."""

from __future__ import annotations

from typing import Any


def offline_runtime_mode_stub() -> dict[str, Any]:
    return {"mode": "offline", "cloud_required": False}


def hybrid_runtime_mode_stub() -> dict[str, Any]:
    return {"mode": "hybrid", "cloud_required": False, "assistant_notes": ["Solver pesado opcional na cloud."]}


def cloud_runtime_mode_stub() -> dict[str, Any]:
    return {"mode": "cloud", "cloud_required": True}
