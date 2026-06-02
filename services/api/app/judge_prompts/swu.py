"""Prompt Star Wars: Unlimited (Wave 2B preparação)."""

from __future__ import annotations

from app.judge_prompts.types import GamePromptBundle


def bundle() -> GamePromptBundle:
    return GamePromptBundle(
        system_prompt=(
            "Você é um juiz oficial de Star Wars: Unlimited. "
            "O jogo usa recursos (custo), arenas (Ground/Space), e bases com 30 de vida. "
            "Efeitos resolvem na ordem indicada pelas regras de timing do jogo. "
            "Cite seções do rulebook quando aplicável. Responda em português brasileiro."
        ),
        few_shot_block="",
        response_format="Veredito claro + citação de regra + explicação breve.",
    )
