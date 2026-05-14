"""Registo de ordem de precedência por jogo (não hardcoded só em MTG)."""

from __future__ import annotations

import importlib
from collections.abc import Sequence

_DEFAULT: tuple[str, ...] = (
    "event",
    "replacement",
    "sba",
    "triggered",
    "stack",
    "priority",
)


def get_precedence_order(game_slug: str) -> Sequence[str]:
    try:
        mod = importlib.import_module(f"app.games.{game_slug}.reasoning_rules")
        order = getattr(mod, "PRECEDENCE_ORDER", None)
        if order and isinstance(order, list | tuple):
            return tuple(str(x) for x in order)
    except ModuleNotFoundError:
        pass
    return _DEFAULT
