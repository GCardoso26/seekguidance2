"""Sprint 0 — higiene da vitrine pública do marketplace.

Regras:
- Lojas `is_test` nunca aparecem no browse/search/PDP públicos.
- Anúncios com nome/SKU/descrição de seed/teste ficam fora.
- Imagens fixture://, não-http(s) ou URL de busca Amazon são inválidas.
- Novos anúncios públicos exigem ≥1 imagem https válida.
"""

from __future__ import annotations

import re
from typing import Any

from fastapi import HTTPException

from app.catalog.image_utils import normalize_tcgdex_image_url

# Cláusula SQL (alias p=store_products, s=stores) para listagens públicas.
STORE_NOT_TEST_SQL = "COALESCE(s.is_test, false) = false"

PUBLIC_LISTING_SQL = f"""
(
  {STORE_NOT_TEST_SQL}
  AND p.name !~* '(teste|\\btest\\b|seed|carta[[:space:]]*#)'
  AND COALESCE(p.description, '') !~* '(seed[[:space:]]+persona|\\bseed\\b)'
  AND COALESCE(p.sku, '') !~* '^(PERSONA-|TEST-)|-TEST-'
)
"""

_JUNK_NAME_RE = re.compile(r"(teste|\btest\b|seed|carta\s*#)", re.IGNORECASE)
_JUNK_DESC_RE = re.compile(r"(seed\s+persona|\bseed\b)", re.IGNORECASE)
_JUNK_SKU_RE = re.compile(r"^(PERSONA-|TEST-)|-TEST-", re.IGNORECASE)

# Preço acima disso (sem carta de catálogo) é suspeito na publicação.
MAX_PUBLIC_PRICE_CENTS_WITHOUT_CATALOG = 500_000  # R$ 5.000


def is_valid_public_image_url(url: str | None) -> bool:
    if not url or not isinstance(url, str):
        return False
    u = url.strip()
    if not u:
        return False
    if u.lower().startswith("fixture:"):
        return False
    if not (u.startswith("http://") or u.startswith("https://")):
        return False
    low = u.lower()
    # Search result pages are not product images.
    if "amazon." in low and ("/s?" in low or "/s/" in low or "k=" in low):
        return False
    # Placeholder / non-routable demo hosts (Sprint 2).
    if "via.placeholder.com" in low or "placeholder.com/" in low:
        return False
    if ".example/" in low or low.endswith(".example") or ".example." in low:
        return False
    if "judgetcg.example" in low:
        return False
    # ADR-016: set logos/symbols are not product packshots (Pokémon TCG API, Scryfall SVGs).
    if "images.pokemontcg.io" in low and ("/logo" in low or "/symbol" in low):
        return False
    if "svgs.scryfallcdn.com" in low or ("scryfall" in low and low.endswith(".svg")):
        return False
    return True


def resolve_listing_images(
    *,
    stored: list[str] | None,
    asset_cdn_url: str | None = None,
    catalog_image_url: str | None = None,
) -> list[str]:
    """Prioriza images do anúncio; senão asset do catálogo mestre; senão carta."""
    clean = sanitize_public_images(stored)
    if clean:
        return clean
    for candidate in (asset_cdn_url, catalog_image_url):
        if is_valid_public_image_url(candidate):
            return [normalize_tcgdex_image_url(str(candidate).strip()) or str(candidate).strip()]
    return []


def sanitize_public_images(images: list[str] | None) -> list[str]:
    return [u.strip() for u in (images or []) if is_valid_public_image_url(u)]


def assert_public_listing_payload(
    *,
    name: str,
    description: str | None,
    sku: str | None,
    images: list[str] | None,
    price_cents: int,
    catalog_card_id: str | None = None,
    require_image: bool = True,
) -> list[str]:
    """Valida payload de anúncio destinado à vitrine. Retorna images sanitizadas."""
    n = (name or "").strip()
    if not n:
        raise HTTPException(400, "Nome do produto obrigatório")
    if _JUNK_NAME_RE.search(n):
        raise HTTPException(400, "Nome de produto inválido para vitrine pública (teste/seed)")
    if description and _JUNK_DESC_RE.search(description):
        raise HTTPException(400, "Descrição inválida para vitrine pública (seed/teste)")
    if sku and _JUNK_SKU_RE.search(sku):
        raise HTTPException(400, "SKU inválido para vitrine pública (teste/seed)")
    if price_cents <= 0:
        raise HTTPException(400, "Preço inválido")
    if (
        catalog_card_id is None
        and price_cents >= MAX_PUBLIC_PRICE_CENTS_WITHOUT_CATALOG
    ):
        raise HTTPException(
            400,
            "Preço muito alto sem vínculo de catálogo — revise antes de publicar",
        )

    clean = sanitize_public_images(images)
    if require_image and not clean:
        raise HTTPException(
            400,
            "Anúncio público exige pelo menos uma imagem https válida",
        )
    return clean


def store_blocked_from_public(store: dict[str, Any]) -> bool:
    return bool(store.get("is_test"))
