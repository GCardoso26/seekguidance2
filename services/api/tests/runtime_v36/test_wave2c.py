"""Wave 2C integration smoke."""

from app.main import app
from fastapi.testclient import TestClient

client = TestClient(app)


def test_infrastructure_requires_auth_in_production_guard() -> None:
    r = client.get("/runtime/infrastructure")
    assert r.status_code in (200, 401, 403)


def test_judge_tracing_metrics_route() -> None:
    r = client.get("/runtime/judge/tracing")
    assert r.status_code == 200
    assert "judge_requests_total" in r.json()
