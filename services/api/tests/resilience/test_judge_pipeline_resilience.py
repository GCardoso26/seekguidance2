"""Resiliência do Judge — degradação graciosa quando dependências falham."""

import pytest
from app.retrieval.rerank import IdentityReranker


@pytest.mark.asyncio
async def test_reranker_health_check_no_raise() -> None:
    assert await IdentityReranker().health_check() is True


