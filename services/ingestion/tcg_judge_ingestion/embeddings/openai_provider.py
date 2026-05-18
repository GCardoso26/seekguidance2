from __future__ import annotations

import tiktoken
from openai import AsyncOpenAI

from tcg_judge_ingestion.embeddings.base import EmbeddingProvider

# text-embedding-3-* aceita no máximo 8192 tokens por input
_EMBED_MAX_TOKENS = 8191
_ENC = tiktoken.get_encoding("cl100k_base")


def truncate_for_embedding(text: str, *, max_tokens: int = _EMBED_MAX_TOKENS) -> str:
    tokens = _ENC.encode(text)
    if len(tokens) <= max_tokens:
        return text
    return _ENC.decode(tokens[:max_tokens])


class OpenAIEmbeddingProvider(EmbeddingProvider):
    def __init__(
        self,
        api_key: str,
        *,
        model: str = "text-embedding-3-large",
        dimensions: int = 1536,
    ) -> None:
        self._client = AsyncOpenAI(api_key=api_key)
        self.model_name = model
        self.dimensions = dimensions

    async def embed_batch(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []
        inputs = [truncate_for_embedding(t) for t in texts]
        resp = await self._client.embeddings.create(
            model=self.model_name,
            input=inputs,
            dimensions=self.dimensions,
        )
        data = sorted(resp.data, key=lambda d: d.index)
        return [list(d.embedding) for d in data]
