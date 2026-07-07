"""Abstração LLM — nunca acoplar a um vendor."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Protocol


@dataclass(frozen=True)
class LlmCompletionResult:
    text: str
    provider_id: str
    prompt_id: str
    prompt_version: str
    latency_ms: int
    input_tokens: int | None = None
    output_tokens: int | None = None
    estimated_cost_usd: float | None = None


class LlmProvider(Protocol):
    provider_id: str

    async def complete(
        self,
        prompt_id: str,
        variables: dict[str, Any],
    ) -> LlmCompletionResult: ...
