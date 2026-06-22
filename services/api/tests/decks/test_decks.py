"""Testes do serviço de decks."""

from __future__ import annotations

from app.decks.decks import _group_cards, _max_copies, normalize_deck


def test_max_copies_commander():
    assert _max_copies("commander") == 1
    assert _max_copies("standard") == 4


def test_group_cards_by_zone():
    cards = [
        {"zone": "main", "id": "1"},
        {"zone": "sideboard", "id": "2"},
        {"zone": "commander", "id": "3"},
    ]
    grouped = _group_cards(cards)
    assert len(grouped["main_deck"]) == 1
    assert len(grouped["sideboard"]) == 1
    assert len(grouped["commander"]) == 1


def test_normalize_deck_shape():
    row = {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "Azorius Control",
        "description": None,
        "game": "mtg",
        "format": "standard",
        "owner_id": "user-1",
        "is_public": False,
        "total_cards": 60,
        "total_price": 12000,
        "likes": 0,
        "views": 0,
        "created_at": None,
        "updated_at": None,
    }
    deck = normalize_deck(row)
    assert deck["name"] == "Azorius Control"
    assert deck["main_deck"] == []
    assert deck["total_price"] == 12000
