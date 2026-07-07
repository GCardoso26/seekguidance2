"""Mock LLM — padrão em testes e CI."""

from __future__ import annotations

import time
from typing import Any

from app.ai.prompts.registry import render_prompt
from app.ai.providers.llm_provider import LlmCompletionResult


class MockLlmProvider:
    provider_id = "mock"

    async def complete(self, prompt_id: str, variables: dict[str, Any]) -> LlmCompletionResult:
        started = time.perf_counter()
        text, tpl = render_prompt(prompt_id, variables)
        latency_ms = int((time.perf_counter() - started) * 1000)
        return LlmCompletionResult(
            text=text,
            provider_id=self.provider_id,
            prompt_id=tpl.id,
            prompt_version=tpl.version,
            latency_ms=latency_ms,
            input_tokens=len(str(variables)) // 4,
            output_tokens=len(text) // 4,
            estimated_cost_usd=0.0,
        )
