"""Reranking: abstração + BGE cross-encoder (lazy load)."""

from __future__ import annotations

import asyncio
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any

import structlog

logger = structlog.get_logger(__name__)


@dataclass
class RankedChunk:
    chunk_id: str
    text: str
    rule_path: str | None
    semantic_path: str | None
    document_title: str
    source_url: str
    score: float


class BaseReranker(ABC):
    @abstractmethod
    async def rerank(self, query: str, candidates: list[RankedChunk], top_n: int) -> list[RankedChunk]:
        raise NotImplementedError


class IdentityReranker(BaseReranker):
    async def rerank(self, query: str, candidates: list[RankedChunk], top_n: int) -> list[RankedChunk]:
        return candidates[:top_n]


class BGEReranker(BaseReranker):
    """BAAI/bge-reranker-large (ou compatível) via sentence_transformers CrossEncoder."""

    def __init__(self, model_name: str, *, batch_size: int = 8) -> None:
        self._model_name = model_name
        self._batch_size = max(1, int(batch_size))
        self._model: Any = None

    def _ensure_model(self) -> Any:
        if self._model is None:
            try:
                from sentence_transformers import CrossEncoder
            except ImportError as exc:  # pragma: no cover
                raise RuntimeError(
                    "sentence-transformers não instalado. "
                    "Instale com `pip install sentence-transformers` ou desative RERANKER_ENABLED."
                ) from exc
            logger.info("reranker.load", model=self._model_name)
            self._model = CrossEncoder(self._model_name, max_length=512)
        return self._model

    def _predict_sync(self, query: str, candidates: list[RankedChunk]) -> list[float]:
        model = self._ensure_model()
        pairs = [[query, c.text[:8000]] for c in candidates]
        scores: list[float] = []
        for i in range(0, len(pairs), self._batch_size):
            batch = pairs[i : i + self._batch_size]
            part = model.predict(batch, convert_to_numpy=True, show_progress_bar=False)
            import numpy as np

            arr = np.asarray(part, dtype=float).reshape(-1)
            scores.extend(float(x) for x in arr.tolist())
        return scores

    async def rerank(self, query: str, candidates: list[RankedChunk], top_n: int) -> list[RankedChunk]:
        if not candidates:
            return []
        scores = await asyncio.to_thread(self._predict_sync, query, candidates)
        decorated = sorted(
            (
                RankedChunk(
                    chunk_id=c.chunk_id,
                    text=c.text,
                    rule_path=c.rule_path,
                    semantic_path=c.semantic_path,
                    document_title=c.document_title,
                    source_url=c.source_url,
                    score=float(s),
                )
                for c, s in zip(candidates, scores, strict=True)
            ),
            key=lambda r: -r.score,
        )
        return decorated[:top_n]


def build_reranker(*, enabled: bool, model_name: str, batch_size: int) -> BaseReranker:
    if not enabled:
        return IdentityReranker()
    return BGEReranker(model_name, batch_size=batch_size)


class RerankerProvider:
    """Compat: delega para BaseReranker injetável."""

    def __init__(self, impl: BaseReranker | None = None) -> None:
        self._impl: BaseReranker = impl or IdentityReranker()

    def with_impl(self, impl: BaseReranker) -> RerankerProvider:
        self._impl = impl
        return self

    async def rerank(self, query: str, candidates: list[RankedChunk], top_n: int) -> list[RankedChunk]:
        return await self._impl.rerank(query, candidates, top_n)
