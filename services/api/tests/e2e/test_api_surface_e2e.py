"""E2E: superfície HTTP da API (stack + OpenAPI + smoke chat)."""

from __future__ import annotations

import os

import httpx
import pytest

pytestmark = pytest.mark.e2e


@pytest.mark.skipif(
    os.getenv("RUN_E2E") != "1",
    reason="Defina RUN_E2E=1 e API acessível (ver docs/JUDGE_PRODUCTION_READINESS.md).",
)
def test_e2e_health_openapi_and_root() -> None:
    base = os.getenv("E2E_API_BASE", "http://127.0.0.1:8000").rstrip("/")
    with httpx.Client(timeout=30.0) as client:
        r = client.get(f"{base}/")
        assert r.status_code == 200
        assert "service" in r.json()

        h = client.get(f"{base}/v1/health")
        assert h.status_code == 200
        body = h.json()
        assert body.get("status") == "ok" or "ok" in str(body).lower()

        o = client.get(f"{base}/openapi.json")
        assert o.status_code == 200
        spec = o.json()
        assert spec.get("openapi")
        paths = spec.get("paths") or {}
        assert "/v1/chat/ask" in paths or any("chat" in p for p in paths)


@pytest.mark.skipif(
    os.getenv("RUN_E2E") != "1",
    reason="RUN_E2E=1 + API.",
)
def test_e2e_chat_ask_smoke_judge_mode() -> None:
    """Smoke único: valida contrato HTTP sem exigir reasoning preenchido (sem OPENAI pode ser stub)."""
    base = os.getenv("E2E_API_BASE", "http://127.0.0.1:8000").rstrip("/")
    payload = {
        "game_slug": "mtg",
        "question": "What is priority in multiplayer?",
        "mode": "judge",
        "prefer_historical": False,
        "explain_retrieval": True,
        "include_reasoning_engine": True,
    }
    r = httpx.post(f"{base}/v1/chat/ask", json=payload, timeout=120.0)
    assert r.status_code == 200, r.text
    data = r.json()
    assert "answer" in data
    assert data.get("confidence", 0) >= 0.0
    assert isinstance(data.get("citations"), list)
    assert data.get("retrieval_reasons") is None or isinstance(data.get("retrieval_reasons"), list)
    if data.get("explainability") is not None:
        assert "graph_confidence" in data["explainability"]
    # reasoning_v1–v11: quando presentes, validar chaves mínimas (não obrigatório sem LLM/dados)
    for key in (
        "reasoning_v3",
        "reasoning_v4",
        "reasoning_v5",
        "reasoning_v6",
        "reasoning_v7",
        "reasoning_v8",
        "reasoning_v9",
        "reasoning_v10",
        "reasoning_v11",
    ):
        block = data.get(key)
        if block is not None:
            assert isinstance(block, dict), key
