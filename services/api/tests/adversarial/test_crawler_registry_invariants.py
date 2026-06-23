"""Testes adversariais leves (registry / slugs)."""

from __future__ import annotations

import pytest

pytestmark = pytest.mark.adversarial


def test_no_unknown_game_slug_in_crawlers_real() -> None:
    from tcg_judge_ingestion.crawlers_real.registry import list_game_slugs

    allowed = {
        "mtg",
        "yugioh",
        "pokemon",
        "onepiece",
        "digimon",
        "fab",
        "lorcana",
        "riftbound",
        "gundam",
        "dbfw",
        "sorcery",
        "vanguard",
        "union_arena",
    }
    assert set(list_game_slugs()) == allowed
