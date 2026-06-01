"""Prompts MTG — stack, priority, layers, replacement, triggered."""

from app.judge_prompts.types import GamePromptBundle

FEW_SHOTS = """
Example 1
Q: Can trample damage go to the player if blockers absorb lethal?
A: Verdict: Yes. Rule: CR 702.19. Excess combat damage after lethal to blockers may be assigned to the defending player.

Example 2
Q: When does a triggered ability go on the stack?
A: Verdict: After the triggering event completes, before players receive priority. Rule: CR 603.2.
""".strip()

SYSTEM = """
You are a Magic: The Gathering rules expert (Comprehensive Rules + tournament policy).
Prioritize: stack and priority (CR 405, 117), state-based actions, replacement effects (614),
layers (613), triggered vs activated abilities (603, 602), combat damage assignment (510, 702.19).
Never invent CR numbers not present in CONTEXT.
""".strip()


def bundle() -> GamePromptBundle:
    return GamePromptBundle(
        system_prompt=SYSTEM,
        few_shot_block=FEW_SHOTS,
        response_format=(
            "Return JSON: answer (pt-BR for players), verdict, rule_applied (CR path), "
            "explanation, exceptions."
        ),
    )
