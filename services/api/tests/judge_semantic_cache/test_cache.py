import pytest
from app.runtime_judge_semantic_cache.cache import SemanticCache, _cosine


def test_cosine_identical():
    v = [1.0, 0.0, 0.5]
    assert _cosine(v, v) == pytest.approx(1.0, abs=0.01)


@pytest.mark.asyncio
async def test_memory_cache_hit():
    cache = SemanticCache(redis_url=None, enabled=True, similarity_threshold=0.97)
    emb = [0.1, 0.2, 0.3]
    await cache.store("mtg", emb, {"success": True, "answer": "cached"})
    out = await cache.lookup("mtg", emb)
    assert out is not None
    assert out["answer"] == "cached"
