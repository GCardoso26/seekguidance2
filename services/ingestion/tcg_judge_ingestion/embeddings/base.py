from __future__ import annotations

from abc import ABC, abstractmethod


class EmbeddingProvider(ABC):
    model_name: str
    dimensions: int

    @abstractmethod
    async def embed_batch(self, texts: list[str]) -> list[list[float]]:
        """Retorna vetores na ordem dos textos."""
