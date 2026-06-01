"""Seleção de prompts por game_slug (sem ifs gigantes no orchestrator)."""

from __future__ import annotations

from typing import Callable

from app.judge_prompts.types import GamePromptBundle
from app.judge_prompts import lorcana as lorcana_prompt
from app.judge_prompts import mtg as mtg_prompt
from app.judge_prompts import onepiece as onepiece_prompt
from app.judge_prompts import pokemon as pokemon_prompt
from app.judge_prompts import yugioh as yugioh_prompt


def _default_bundle() -> GamePromptBundle:
    return GamePromptBundle(
        system_prompt=(
            "You are an expert trading card game rules assistant. "
            "Answer ONLY using the structured CONTEXT. "
            "Do not invent rule numbers."
        ),
        few_shot_block="",
        response_format="Return JSON with keys: answer, verdict, rule_applied, explanation, exceptions.",
    )


_REGISTRY: dict[str, Callable[[], GamePromptBundle]] = {
    "mtg": mtg_prompt.bundle,
    "pokemon": pokemon_prompt.bundle,
    "yugioh": yugioh_prompt.bundle,
    "lorcana": lorcana_prompt.bundle,
    "onepiece": onepiece_prompt.bundle,
}


def get_game_prompt_bundle(game_slug: str) -> GamePromptBundle:
    factory = _REGISTRY.get(game_slug.strip().lower())
    if factory is None:
        return _default_bundle()
    return factory()
