import pytest
from app.main import app
from httpx import ASGITransport, AsyncClient


@pytest.mark.asyncio
async def test_health() -> None:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        r = await client.get("/v1/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] in ("ok", "healthy", "degraded")
    assert "features" in body
    assert "shipping_v2" in body["features"]
