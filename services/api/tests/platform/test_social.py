"""Friends, messages e communities — suite consolidada."""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock

import pytest
from app.social.friendships import list_pending_requests


class TestFriendRequestFlow:
    def test_status_values(self):
        allowed = {"none", "pending", "accepted", "blocked"}
        assert "pending" in allowed

    @pytest.mark.asyncio
    async def test_list_pending_requests(self):
        db = AsyncMock()
        db.execute = AsyncMock(
            return_value=MagicMock(
                mappings=lambda: MagicMock(
                    all=lambda: [
                        {
                            "id": "u1",
                            "handle": "alice",
                            "display_name": "Alice",
                            "avatar_url": None,
                            "status": "pending",
                            "friendship_id": "f1",
                        }
                    ]
                )
            )
        )
        rows = await list_pending_requests(db, "target-user")
        assert len(rows) == 1
        assert rows[0]["handle"] == "alice"
