"""Provedores externos de catálogo e preços (Infrastructure / External)."""

from app.infrastructure.external.providers.card_catalog_provider import CardCatalogProvider
from app.infrastructure.external.providers.catalog_resolver import get_catalog_provider_for_game
from app.infrastructure.external.providers.tcg_api_provider import TcgApiProvider
from app.infrastructure.external.providers.tcg_csv_provider import TcgCsvProvider

__all__ = [
    "CardCatalogProvider",
    "TcgApiProvider",
    "TcgCsvProvider",
    "get_catalog_provider_for_game",
]
