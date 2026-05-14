"""Carrega constraints declarativos por jogo (`constraint_rules.py`)."""

from __future__ import annotations

import importlib
from typing import Any


def get_game_constraints(game_slug: str) -> dict[str, Any]:
    try:
        mod = importlib.import_module(f"app.games.{game_slug}.constraint_rules")
    except ModuleNotFoundError:
        return {
            "must_precede": (),
            "mutex_roles": (),
            "timing_requires": {},
            "max_propagation": 24,
        }
    return {
        "must_precede": tuple(getattr(mod, "MUST_PRECEDE", ()) or ()),
        "mutex_roles": tuple(getattr(mod, "MUTEX_ROLES", ()) or ()),
        "timing_requires": dict(getattr(mod, "TIMING_REQUIRES", {}) or {}),
        "max_propagation": int(getattr(mod, "MAX_PROPAGATION_STEPS", 24)),
    }
