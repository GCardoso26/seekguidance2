from __future__ import annotations

from app.core.config import get_settings
from app.infrastructure.external.providers.tcg_api_provider import TcgApiProvider
from app.infrastructure.external.providers.tcg_csv_provider import TcgCsvProvider


def get_catalog_provider_for_game(game_code: str) -> list:
    """Retorna cadeia de provedores por prioridade (primeiro configurado vence)."""
    settings = get_settings()
    code = game_code.upper()
    chain = []

    tcgapi = TcgApiProvider(api_key=settings.tcg_api_key)
    if tcgapi.configured:
        chain.append(tcgapi)

    if code == "VANGUARD":
        chain.append(TcgCsvProvider())

    return chain
