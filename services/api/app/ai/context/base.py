"""Context providers — cada um independente, sem SQL direto."""

from __future__ import annotations

from typing import Protocol

from sqlalchemy.ext.asyncio import AsyncSession


class ContextProvider(Protocol):
    name: str

    async def fetch(self, session: AsyncSession, owner_id: str, store_id: str) -> dict: ...
