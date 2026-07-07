"""OpenAI provider — RA-009: fora de transaction."""

from __future__ import annotations

import time
from typing import Any

from app.ai.prompts.registry import render_prompt
from app.ai.providers.llm_provider import LlmCompletionResult
from app.ai.providers.mock_provider import MockLlmProvider


class OpenAiLlmProvider:
    """Wrapper opcional; fallback para mock quando chave ausente."""

    provider_id = "openai"

    def __init__(self) -> None:
        self._fallback = MockLlmProvider()

    async def complete(self, prompt_id: str, variables: dict[str, Any]) -> LlmCompletionResult:
        from app.core.config import get_settings

        settings = get_settings()
        if not getattr(settings, "openai_api_key", None):
            return await self._fallback.complete(prompt_id, variables)

        text, tpl = render_prompt(prompt_id, variables)
        started = time.perf_counter()
        try:
            from openai import AsyncOpenAI

            client = AsyncOpenAI(api_key=settings.openai_api_key)
            resp = await client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "Você é um assistente operacional de e-commerce TCG. Seja conciso."},
                    {"role": "user", "content": text},
                ],
                max_tokens=400,
                temperature=0.3,
            )
            out = resp.choices[0].message.content or text
            usage = resp.usage
            return LlmCompletionResult(
                text=out,
                provider_id=self.provider_id,
                prompt_id=tpl.id,
                prompt_version=tpl.version,
                latency_ms=int((time.perf_counter() - started) * 1000),
                input_tokens=usage.prompt_tokens if usage else None,
                output_tokens=usage.completion_tokens if usage else None,
                estimated_cost_usd=0.001,
            )
        except Exception:
            return await self._fallback.complete(prompt_id, variables)
