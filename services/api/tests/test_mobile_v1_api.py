import pytest
from app.main import app
from httpx import ASGITransport, AsyncClient


@pytest.mark.asyncio
async def test_mobile_v1_routes() -> None:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        r = await client.get("/v1/mobile/sync/status")
    assert r.status_code == 200
    data = r.json()
    assert "assistant_notes" in data
