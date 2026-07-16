"""Seed guards."""

from __future__ import annotations

import pytest
from app.sandbox.seeder import SeedBlockedError, seed_demo


@pytest.mark.asyncio
async def test_seed_blocked_in_production(monkeypatch) -> None:
    monkeypatch.setattr("app.sandbox.seeder.can_run_seed_demo", lambda: False)
    with pytest.raises(SeedBlockedError):
        await seed_demo(session=None)  # type: ignore[arg-type]
