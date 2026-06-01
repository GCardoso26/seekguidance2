"""Testes do reranker (Cohere mock + identity)."""

from __future__ import annotations

import sys
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from app.retrieval.rerank import (
    CohereReranker,
    IdentityReranker,
    RankedChunk,
    build_reranker,
)


def _chunk(cid: str, score: float = 0.5) -> RankedChunk:
    return RankedChunk(
        chunk_id=cid,
        text=f"text {cid}",
        rule_path=None,
        semantic_path=None,
        document_title="CR",
        source_url="https://example.com",
        score=score,
    )


@pytest.mark.asyncio
async def test_identity_reranker_limits_top_n():
    r = IdentityReranker()
    out = await r.rerank("q", [_chunk("a"), _chunk("b"), _chunk("c")], top_n=2)
    assert len(out) == 2
    assert out[0].chunk_id == "a"


@pytest.mark.asyncio
async def test_cohere_reranker_reorders():
    reranker = CohereReranker(api_key="test-key")
    candidates = [_chunk("a", 0.1), _chunk("b", 0.2)]

    mock_result = MagicMock()
    mock_result.index = 1
    mock_result.relevance_score = 0.99
    mock_response = MagicMock()
    mock_response.results = [mock_result]

    mock_client = MagicMock()
    mock_client.rerank = AsyncMock(return_value=mock_response)

    fake_cohere = MagicMock()
    fake_cohere.AsyncClient = MagicMock(return_value=mock_client)
    with patch.dict(sys.modules, {"cohere": fake_cohere}):
        out = await reranker.rerank("trample?", candidates, top_n=1)

    assert len(out) == 1
    assert out[0].chunk_id == "b"
    assert out[0].score == pytest.approx(0.99)


def test_build_reranker_disabled():
    assert isinstance(build_reranker(enabled=False, model_name="x", batch_size=4), IdentityReranker)


def test_build_reranker_cohere_requires_key():
    with pytest.raises(ValueError, match="COHERE_API_KEY"):
        build_reranker(
            enabled=True,
            model_name="rerank-multilingual-v3.0",
            batch_size=4,
            provider="cohere",
            cohere_api_key=None,
        )
