"""Wave 2B — endpoints de produto."""

from app.main import app
from fastapi.testclient import TestClient

client = TestClient(app)


def test_growth_dashboard_endpoint() -> None:
    r = client.get("/runtime/judge/growth?days=7")
    assert r.status_code == 200
    data = r.json()
    assert "dau" in data
    assert "related_question_ctr" in data


def test_growth_event_rejects_unknown_type() -> None:
    r = client.post(
        "/runtime/judge/growth/event",
        json={"metric_type": "invalid_event"},
    )
    assert r.status_code == 400
