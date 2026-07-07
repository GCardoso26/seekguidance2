from __future__ import annotations

from typing import Protocol, runtime_checkable

from app.infrastructure.external.providers.types import CatalogCard, CatalogSet, PriceQuote


@runtime_checkable
class CardCatalogProvider(Protocol):
    """Contrato de provedor externo — domínio não conhece a origem dos dados."""

    provider_id: str

    async def list_sets(self, game_code: str) -> list[CatalogSet]:
        """Lista expansões/coleções do jogo."""
        ...

    async def list_cards_in_set(
        self,
        game_code: str,
        set_ref: CatalogSet,
        *,
        limit: int | None = None,
    ) -> list[CatalogCard]:
        """Lista cartas de uma coleção."""
        ...

    async def search_price(
        self,
        card_name: str,
        *,
        game: str,
        set_code: str | None = None,
    ) -> PriceQuote | None:
        """Cotação de mercado (quando suportado pelo provedor)."""
        ...

    async def bulk_prices(
        self,
        card_names: list[str],
        *,
        game: str,
    ) -> list[PriceQuote]:
        """Preços em lote."""
        ...
