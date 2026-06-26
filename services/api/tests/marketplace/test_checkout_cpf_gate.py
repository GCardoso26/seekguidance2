"""Gate CPF em initiate_checkout (Sprint 2)."""

from __future__ import annotations

from unittest.mock import AsyncMock, patch

import pytest
from app.marketplace import checkout_atomic
from fastapi import HTTPException


@pytest.mark.asyncio
async def test_initiate_checkout_calls_require_active_account():
    session = AsyncMock()
    user_id = "user-cpf-gate"

    with (
        patch("app.marketplace.checkout_atomic.ensure_player_profile", new_callable=AsyncMock),
        patch("app.marketplace.checkout_atomic.require_active_account", new_callable=AsyncMock) as mock_require,
        patch("app.marketplace.checkout_atomic.shop_cart.get_cart", new_callable=AsyncMock) as mock_cart,
    ):
        mock_require.side_effect = HTTPException(
            403,
            detail={"code": "cpf_required", "message": "Insira e valide seu CPF para realizar compras."},
        )

        with pytest.raises(HTTPException) as exc:
            await checkout_atomic.initiate_checkout(session, user_id)

        assert exc.value.status_code == 403
        mock_require.assert_awaited_once_with(session, user_id)
        mock_cart.assert_not_called()
