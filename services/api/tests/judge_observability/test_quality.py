import pytest
from app.judge.observability import judge_quality_payload


@pytest.mark.asyncio
async def test_quality_payload_structure():
    class _Session:
        async def execute(self, *_a, **_k):
            class _R:
                def mappings(self):
                    return self

                def all(self):
                    return []

            return _R()

    out = await judge_quality_payload(_Session(), days=7)
    assert out["integrity_status"] == "ok"
    assert "cache" in out
    assert "latency" in out
