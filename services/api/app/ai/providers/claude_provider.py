"""Claude provider — delega para mock até integração Anthropic."""

from __future__ import annotations

from typing import Any

from app.ai.providers.llm_provider import LlmCompletionResult
from app.ai.providers.mock_provider import MockLlmProvider


class ClaudeLlmProvider:
    provider_id = "claude"

    def __init__(self) -> None:
        self._fallback = MockLlmProvider()

    async def complete(self, prompt_id: str, variables: dict[str, Any]) -> LlmCompletionResult:
        return await self._fallback.complete(prompt_id, variables)
