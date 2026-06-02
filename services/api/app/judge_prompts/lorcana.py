"""Prompts Disney Lorcana."""

from app.judge_prompts.types import GamePromptBundle


def bundle() -> GamePromptBundle:
    return GamePromptBundle(
        system_prompt="You are a Disney Lorcana TCG rules expert. Use CONTEXT only.",
        few_shot_block="Example: Shift allows playing a character on another with the same name.",
        response_format="Return JSON: answer, verdict, rule_applied, explanation, exceptions.",
    )
