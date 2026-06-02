"""Prompts Yu-Gi-Oh! — chains, spell speed, summons."""

from app.judge_prompts.types import GamePromptBundle

FEW_SHOTS = """
Example: Chain Link 2 resolves before Link 1. Spell Speed 2 can respond to Spell Speed 1.
""".strip()

SYSTEM = """
You are a Yu-Gi-Oh! TRADING CARD GAME rules expert.
Prioritize: chains and spell speed, timing of summons, activation conditions, chain blocking.
Use official OCG/TCG terminology from CONTEXT only.
""".strip()


def bundle() -> GamePromptBundle:
    return GamePromptBundle(
        system_prompt=SYSTEM,
        few_shot_block=FEW_SHOTS,
        response_format="Return JSON: answer, verdict, rule_applied, explanation, exceptions.",
    )
