"""Inferência leve de janelas de timing por jogo e texto da pergunta."""

from __future__ import annotations

import importlib
from typing import Any


def _windows_mod(game_slug: str) -> tuple[str, ...]:
    try:
        mod = importlib.import_module(f"app.games.{game_slug}.reasoning_rules")
        w = getattr(mod, "TIMING_WINDOWS", ())
        if isinstance(w, list | tuple):
            return tuple(str(x) for x in w)
    except ModuleNotFoundError:
        pass
    return ("main",)


def infer_timing(question: str, game_slug: str) -> dict[str, Any]:
    q = (question or "").lower()
    windows = _windows_mod(game_slug)
    window = windows[0]
    priority_pass = False
    if "cleanup" in q:
        window = "cleanup_step" if game_slug == "mtg" else window
    if "priority" in q or "apnap" in q:
        priority_pass = True
        window = "stack_resolution" if game_slug == "mtg" else window
    if game_slug == "yugioh" and ("segoc" in q or "chain" in q):
        window = "open_window"
    if game_slug == "pokemon" and "between turns" in q:
        window = "between_turns"
    return {"window": window, "priority_pass": priority_pass, "known_windows": list(windows)}
