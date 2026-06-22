"""Testes do serviço Liga Pass (XP)."""

from __future__ import annotations

from app.gamification.xp import XP_REWARDS, _stat_increments, _xp_payload


def test_xp_rewards_has_marketplace_actions():
    assert XP_REWARDS["buy_card"] == 10
    assert XP_REWARDS["sell_card"] == 15
    assert XP_REWARDS["list_card"] == 5


def test_stat_increments_buy():
    assert _stat_increments("buy_card") == (1, 0, 0)


def test_stat_increments_sell_and_list():
    assert _stat_increments("sell_card") == (0, 1, 0)
    assert _stat_increments("list_card") == (0, 1, 0)


def test_xp_payload_default_bronze():
    payload = _xp_payload(None)
    assert payload["current_level"] == "bronze"
    assert payload["total_xp"] == 0
    assert payload["xp_to_next"] == 1000


def test_xp_payload_silver_progress():
    payload = _xp_payload(
        {
            "total_xp": 1500,
            "current_level": "silver",
            "level_name": "Prata",
            "color_hex": "#C0C0C0",
            "cashback_percent": 1,
            "free_shipping_threshold": 20000,
            "max_alerts": 25,
            "total_purchases": 3,
            "total_sales": 1,
            "decks_created": 0,
        }
    )
    assert payload["current_level"] == "silver"
    assert payload["progress_percent"] == 12.5
    assert payload["stats"]["purchases"] == 3
