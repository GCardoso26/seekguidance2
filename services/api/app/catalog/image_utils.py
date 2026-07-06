"""Resolução de URLs de imagem do catálogo (image_url + image_uris JSON)."""

from __future__ import annotations

import json
from typing import Any


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


def resolve_card_image(row: dict[str, Any]) -> dict[str, str]:
    """Resolve imageUris a partir de image_uris e image_url."""
    uris = parse_image_uris(row.get("image_uris"))
    fallback = (row.get("image_url") or "").strip()
    if fallback and not uris["normal"]:
        uris = {"small": fallback, "normal": fallback, "large": fallback}
    return uris
