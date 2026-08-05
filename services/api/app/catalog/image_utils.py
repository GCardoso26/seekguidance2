"""Resolução de URLs de imagem do catálogo (image_url + image_uris JSON)."""

from __future__ import annotations

import json
import re
from typing import Any

SORCERY_CDN = "https://d27a44hjr9gen3.cloudfront.net"
_SORCERY_SLUG_RE = re.compile(r"^([a-z]+)-(.+)-([a-z]+)-([sf])$")
_BROKEN_SORCERY_HOST = "cards.sorcerytcg.com"

TCGDEX_ASSETS_HOST = "assets.tcgdex.net"
_IMAGE_EXT_RE = re.compile(r"\.(webp|png|jpe?g)(\?|$)", re.IGNORECASE)


def normalize_tcgdex_image_url(url: str | None) -> str | None:
    """TCGdex serve a imagem em `<base>/<quality>.<ext>`; a base sozinha devolve 404."""
    if not url or not isinstance(url, str):
        return url
    trimmed = url.strip()
    if TCGDEX_ASSETS_HOST not in trimmed:
        return url
    normalized = trimmed.rstrip("/")
    if not normalized.startswith("http") or _IMAGE_EXT_RE.search(normalized):
        return url
    return f"{normalized}/high.webp"


def sorcery_slug_to_image_url(slug: str | None) -> str | None:
    """Converte variant slug da API Sorcery em URL do CDN público (Curiosa/CloudFront)."""
    if not slug or not slug.strip():
        return None
    match = _SORCERY_SLUG_RE.match(slug.strip())
    if not match:
        return None
    set_prefix, name, product, finish = match.groups()
    return f"{SORCERY_CDN}/{set_prefix}/{name}_{product}_{finish}.png"


def normalize_sorcery_image_url(
    url: str | None,
    *,
    card_number: str | None = None,
) -> str | None:
    """Reescreve URLs legadas cards.sorcerytcg.com (host inexistente) para CloudFront."""
    slug: str | None = None
    if url and _BROKEN_SORCERY_HOST in url:
        filename = url.rsplit("/", 1)[-1]
        slug = filename.removesuffix(".jpg").removesuffix(".png").removesuffix(".webp")
    elif card_number and _SORCERY_SLUG_RE.match(card_number.strip()):
        slug = card_number.strip()

    if slug:
        return sorcery_slug_to_image_url(slug) or url
    return url


def parse_image_uris(raw: Any) -> dict[str, str]:
    """Normaliza image_uris (dict, JSON string ou vazio) para chaves small/normal/large."""
    uris: dict[str, Any] = {}
    if isinstance(raw, dict):
        uris = raw
    elif isinstance(raw, str) and raw.strip():
        try:
            parsed = json.loads(raw)
            if isinstance(parsed, dict):
                uris = parsed
        except json.JSONDecodeError:
            uris = {}

    def pick(*keys: str) -> str | None:
        for key in keys:
            value = uris.get(key)
            if isinstance(value, str) and value.strip():
                return value.strip()
        return None

    normal = pick("normal", "large", "small")
    small = pick("small", "normal", "large")
    large = pick("large", "normal", "small")
    return {
        "small": small or normal or "",
        "normal": normal or large or small or "",
        "large": large or normal or small or "",
    }


def _rewrite_sorcery_uris(uris: dict[str, str], card_number: str | None) -> dict[str, str]:
    for key in ("small", "normal", "large"):
        value = uris.get(key) or ""
        if value:
            uris[key] = normalize_sorcery_image_url(value, card_number=card_number) or value
    return uris


def resolve_card_image(row: dict[str, Any]) -> dict[str, str]:
    """Resolve imageUris a partir de image_uris e image_url."""
    card_number = row.get("card_number")
    is_sorcery = str(row.get("game_code") or "").upper() == "SORCERY"

    uris = parse_image_uris(row.get("image_uris"))
    fallback = (row.get("image_url") or "").strip()
    if is_sorcery:
        fallback = normalize_sorcery_image_url(fallback, card_number=card_number) or fallback
        uris = _rewrite_sorcery_uris(uris, card_number)
        if not uris["normal"] and card_number:
            slug_url = sorcery_slug_to_image_url(str(card_number))
            if slug_url:
                uris = {"small": slug_url, "normal": slug_url, "large": slug_url}

    if fallback and not uris["normal"]:
        uris = {"small": fallback, "normal": fallback, "large": fallback}
    return {key: normalize_tcgdex_image_url(value) or value for key, value in uris.items()}
