"""Seleção de prompts por game_slug (sem ifs gigantes no orchestrator)."""

from __future__ import annotations

import importlib
import logging
from collections.abc import Callable

from app.judge_prompts import lorcana as lorcana_prompt
from app.judge_prompts import mtg as mtg_prompt
from app.judge_prompts import onepiece as onepiece_prompt
from app.judge_prompts import pokemon as pokemon_prompt
from app.judge_prompts import swu as swu_prompt
from app.judge_prompts import yugioh as yugioh_prompt
from app.judge_prompts.types import GamePromptBundle

logger = logging.getLogger(__name__)


def _default_bundle() -> GamePromptBundle:
    from app.judge_prompts import generic as generic_prompt

    return generic_prompt.bundle()


_REGISTRY: dict[str, Callable[[], GamePromptBundle]] = {
    "mtg": mtg_prompt.bundle,
    "pokemon": pokemon_prompt.bundle,
    "yugioh": yugioh_prompt.bundle,
    "lorcana": lorcana_prompt.bundle,
    "onepiece": onepiece_prompt.bundle,
    "star_wars_unlimited": swu_prompt.bundle,
}


def get_game_prompt_bundle(game_slug: str) -> GamePromptBundle:
    slug = game_slug.strip().lower()
    factory = _REGISTRY.get(slug)
    if factory is not None:
        return factory()

    module_name = f"app.judge_prompts.{slug}"
    try:
        module = importlib.import_module(module_name)
        if hasattr(module, "bundle"):
            return module.bundle()
    except (ImportError, AttributeError):
        pass

    logger.warning("Nenhum prompt específico para '%s', usando generic.", slug)
    return _default_bundle()
