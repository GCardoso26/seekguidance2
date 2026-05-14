"""Catálogo declarativo de fontes (URLs reais em produção)."""
from __future__ import annotations

from typing import Any

GAME_SLUG = 'yugioh'


def catalog_entries() -> list[dict[str, Any]]:
    return [
        {"kind": "comprehensive_rules", "game": GAME_SLUG, "priority": 1.0, "url_template": None},
        {"kind": "rulings_archive", "game": GAME_SLUG, "priority": 0.95, "url_template": None},
        {"kind": "errata", "game": GAME_SLUG, "priority": 0.9, "url_template": None},
    ]
