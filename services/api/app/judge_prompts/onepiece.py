"""Prompts One Piece Card Game."""

from app.judge_prompts.types import GamePromptBundle


def bundle() -> GamePromptBundle:
    return GamePromptBundle(
        system_prompt="You are a One Piece Card Game rules expert. Prioritize DON!!, stages, and battle timing.",
        few_shot_block="Example: DON!! cards rest to pay costs during your turn.",
        response_format="Return JSON: answer, verdict, rule_applied, explanation, exceptions.",
    )
