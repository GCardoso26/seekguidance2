from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from app.infrastructure.external.providers.tcg_api_provider import TcgApiProvider
from app.infrastructure.external.providers.tcg_csv_provider import TcgCsvProvider
from app.infrastructure.external.providers.types import CatalogSet


@pytest.mark.asyncio
async def test_tcgapi_provider_not_configured_returns_empty():
    provider = TcgApiProvider(api_key=None)
    assert provider.configured is False
    assert await provider.bulk_prices(["Bolt"], game="MTG") == []


@pytest.mark.asyncio
async def test_tcgapi_search_price_parses_response():
    provider = TcgApiProvider(api_key="test-key")
    mock_res = MagicMock()
    mock_res.is_success = True
    mock_res.status_code = 200
    mock_res.json.return_value = {
        "data": [{"name": "Lightning Bolt", "market_price": 1.25, "price_change_7d": "2.1"}],
    }

    with patch.object(provider._http, "request", new_callable=AsyncMock, return_value=mock_res):
        quote = await provider.search_price("Lightning Bolt", game="MTG")

    assert quote is not None
    assert quote.market_price_usd == 1.25
    assert quote.card_name == "Lightning Bolt"


@pytest.mark.asyncio
async def test_tcgcsv_vanguard_list_sets_parses_groups():
    provider = TcgCsvProvider()
    mock_res = MagicMock()
    mock_res.is_success = True
    mock_res.json.return_value = {
        "results": [{"groupId": 1, "abbreviation": "BT01", "name": "Booster Set 1"}],
    }

    with patch.object(provider._http, "request", new_callable=AsyncMock, return_value=mock_res):
        sets = await provider.list_sets("VANGUARD")

    assert len(sets) == 1
    assert sets[0].code == "BT01"


@pytest.mark.asyncio
async def test_tcgcsv_ignores_non_vanguard():
    provider = TcgCsvProvider()
    assert await provider.list_sets("MTG") == []


@pytest.mark.asyncio
async def test_tcgapi_list_cards_respects_limit():
    provider = TcgApiProvider(api_key="test-key")
    set_ref = CatalogSet(code="BT01", name="Set 1", external_id="99")
    mock_res = MagicMock()
    mock_res.is_success = True
    mock_res.json.return_value = {
        "data": [
            {"id": "1", "name": "Card A", "market_price": 0.5},
            {"id": "2", "name": "Card B", "market_price": 1.0},
        ],
        "meta": {"last_page": 1},
    }

    with patch.object(provider._http, "request", new_callable=AsyncMock, return_value=mock_res):
        cards = await provider.list_cards_in_set("VANGUARD", set_ref, limit=1)

    assert len(cards) == 1
    assert cards[0].name == "Card A"
