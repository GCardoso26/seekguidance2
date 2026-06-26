"""Paginação de listagens do painel vendedor."""

from __future__ import annotations

from unittest.mock import AsyncMock, patch

import pytest
from app.marketplace import seller_dashboard as seller_dash


@pytest.mark.asyncio
async def test_list_seller_listings_paginates():
    listings = [{"id": f"listing-{i}"} for i in range(30)]

    with patch(
        "app.marketplace.seller_dashboard.card_listings_svc.list_my_listings",
        new_callable=AsyncMock,
        return_value=listings,
    ):
        page1 = await seller_dash.list_seller_listings(AsyncMock(), "owner-1", page=1, limit=24)
        page2 = await seller_dash.list_seller_listings(AsyncMock(), "owner-1", page=2, limit=24)

    assert page1["total"] == 30
    assert page1["page"] == 1
    assert len(page1["listings"]) == 24
    assert page1["listings"][0]["id"] == "listing-0"

    assert page2["total"] == 30
    assert page2["page"] == 2
    assert len(page2["listings"]) == 6
    assert page2["listings"][0]["id"] == "listing-24"
