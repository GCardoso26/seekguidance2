"""Event registry + idempotency empty key."""

from __future__ import annotations

import pytest
from app.financial_platform.observability import FINANCIAL_PLATFORM_EVENTS
from app.financial_platform.security import require_fresh_idempotency
from app.judge.event_registry import EVENT_REGISTRY
from fastapi import HTTPException


def test_bp3_events_registered() -> None:
    for name in FINANCIAL_PLATFORM_EVENTS:
        assert name in EVENT_REGISTRY, name
        assert EVENT_REGISTRY[name].category == "financial"


@pytest.mark.asyncio
async def test_empty_idempotency_rejected() -> None:
    with pytest.raises(HTTPException) as exc:
        await require_fresh_idempotency(None, "fin_journals", "")  # type: ignore[arg-type]
    assert exc.value.status_code == 400
