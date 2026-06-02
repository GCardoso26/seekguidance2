"""Pré-carga de registry, prompts e confidence profiles."""

from __future__ import annotations

import time
from typing import Any

import structlog

from app.judge.registry import CANONICAL_TCG_BY_GAME_SLUG, TCG_GAME_SLUG
from app.retrieval.confidence_profiles import get_confidence_profile

logger = structlog.get_logger(__name__)

_preload_state: dict[str, Any] = {
    "registry_ready": False,
    "profiles_ready": False,
    "prompts_ready": False,
    "duration_ms": 0.0,
}


def preload_registry_and_profiles() -> dict[str, Any]:
    t0 = time.perf_counter()
    try:
        for slug in CANONICAL_TCG_BY_GAME_SLUG:
            get_confidence_profile(slug)
        _preload_state["profiles_ready"] = True
        _preload_state["registry_ready"] = len(TCG_GAME_SLUG) > 0
        try:
            from app.judge_prompts.registry import get_game_prompt_bundle

            get_game_prompt_bundle("mtg")
            _preload_state["prompts_ready"] = True
        except Exception:
            _preload_state["prompts_ready"] = False
    except Exception as exc:
        logger.warning("preload_registry_failed", error=str(exc))
    _preload_state["duration_ms"] = round((time.perf_counter() - t0) * 1000, 2)
    return dict(_preload_state)


def preload_status() -> dict[str, Any]:
    return dict(_preload_state)
