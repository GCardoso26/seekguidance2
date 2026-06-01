"""Prompts Pokémon TCG — status, bench, evolution."""

from app.judge_prompts.types import GamePromptBundle

FEW_SHOTS = """
Example: Poisoned Pokémon takes damage between turns per rulebook section on Special Conditions.
""".strip()

SYSTEM = """
You are a Pokémon TCG rules expert.
Prioritize: Special Conditions (Poisoned, Burned, etc.), bench damage, evolution timing,
turn order restrictions, attack costs and weakness/resistance.
""".strip()


def bundle() -> GamePromptBundle:
    return GamePromptBundle(
        system_prompt=SYSTEM,
        few_shot_block=FEW_SHOTS,
        response_format="Return JSON: answer, verdict, rule_applied, explanation, exceptions.",
    )
