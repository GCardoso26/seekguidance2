from __future__ import annotations

from openai import AsyncOpenAI

from tcg_judge_ingestion.embeddings.base import EmbeddingProvider


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
        resp = await self._client.embeddings.create(
            model=self.model_name,
            input=texts,
            dimensions=self.dimensions,
        )
        data = sorted(resp.data, key=lambda d: d.index)
        return [list(d.embedding) for d in data]
