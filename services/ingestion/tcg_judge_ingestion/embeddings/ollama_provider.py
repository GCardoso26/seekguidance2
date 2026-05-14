from __future__ import annotations

import httpx

from tcg_judge_ingestion.embeddings.base import EmbeddingProvider


class OllamaEmbeddingProvider(EmbeddingProvider):
    def __init__(self, base_url: str, model: str = "nomic-embed-text", dimensions: int = 768) -> None:
        self._base = base_url.rstrip("/")
        self.model_name = model
        self.dimensions = dimensions

    async def embed_batch(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []
        out: list[list[float]] = []
        async with httpx.AsyncClient(timeout=120.0) as client:
            for t in texts:
                r = await client.post(
                    f"{self._base}/api/embeddings",
                    json={"model": self.model_name, "prompt": t},
                )
                r.raise_for_status()
                body = r.json()
                out.append(list(body["embedding"]))
        return out
