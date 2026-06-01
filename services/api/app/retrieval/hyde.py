"""HyDE — Hypothetical Document Embeddings para query expansion cross-lingual."""

from __future__ import annotations

import structlog
from openai import AsyncOpenAI

logger = structlog.get_logger(__name__)

HYDE_SYSTEM_PROMPT = """You are a TCG (Trading Card Game) rules expert.
Given a question about {game_name} rules (which may be in Portuguese),
write a concise, factual answer in English as if it appeared in the official rulebook.
Use formal rules terminology. Do NOT invent rules — if unsure, write a plausible
but generic rules-document excerpt that covers the topic.
Limit to 3-4 sentences. No markdown. Plain text only."""

HYDE_USER_TEMPLATE = """Question: {question}

Write a short English rules excerpt that would answer this question:"""


async def generate_hypothetical_document(
    question: str,
    game_name: str,
    *,
    openai_api_key: str,
    model: str = "gpt-4o-mini",
) -> str | None:
    """Gera documento hipotético em EN; None se falhar (não bloqueia o pipeline)."""
    try:
        client = AsyncOpenAI(api_key=openai_api_key)
        response = await client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": HYDE_SYSTEM_PROMPT.format(game_name=game_name)},
                {"role": "user", "content": HYDE_USER_TEMPLATE.format(question=question)},
            ],
            max_tokens=200,
            temperature=0.3,
        )
        hypothetical = (response.choices[0].message.content or "").strip()
        if hypothetical:
            logger.debug("hyde.generated", chars=len(hypothetical))
        return hypothetical or None
    except Exception as exc:
        logger.warning("hyde.failed", error=str(exc))
        return None
