"""WishlistAggregate — regras determinísticas de wishlist (Sprint 15).

Sem SQL. Sem acesso a banco. Apenas validação e orquestração de estado.
"""

from __future__ import annotations

import re
import secrets
from typing import Any

from fastapi import HTTPException

DEFAULT_LISTS: list[dict[str, str]] = [
    {"slug": "favoritos", "name": "Favoritos"},
    {"slug": "decks", "name": "Decks"},
    {"slug": "commander", "name": "Commander"},
    {"slug": "pokemon", "name": "Pokémon"},
    {"slug": "lorcana", "name": "Lorcana"},
    {"slug": "compra-futura", "name": "Compra futura"},
    {"slug": "desejos", "name": "Desejos"},
]

_SLUG_RE = re.compile(r"^[a-z0-9][a-z0-9-]{0,78}$")


def slugify_name(name: str) -> str:
    base = re.sub(r"[^a-z0-9]+", "-", name.strip().lower())
    base = base.strip("-") or "lista"
    return base[:78]


def validate_list_name(name: str) -> str:
    cleaned = (name or "").strip()
    if len(cleaned) < 1 or len(cleaned) > 120:
        raise HTTPException(400, "Nome da lista inválido")
    return cleaned


def validate_slug(slug: str) -> str:
    s = (slug or "").strip().lower()
    if not _SLUG_RE.match(s):
        raise HTTPException(400, "Slug inválido")
    return s


def ensure_default_lists_payload(user_id: str) -> list[dict[str, Any]]:
    """Listas seed para novos compradores."""
    return [
        {
            "user_id": user_id,
            "name": "Favoritos",
            "slug": "favoritos",
            "is_default": True,
            "sort_order": 0,
        },
        *[
            {
                "user_id": user_id,
                "name": row["name"],
                "slug": row["slug"],
                "is_default": False,
                "sort_order": i + 1,
            }
            for i, row in enumerate(DEFAULT_LISTS[1:])
        ],
    ]


def can_remove_list(*, is_default: bool, item_count: int) -> None:
    if is_default:
        raise HTTPException(400, "Não é possível remover a lista padrão")
    if item_count > 0:
        raise HTTPException(409, "Mova ou remova os itens antes de excluir a lista")


def merge_list_names(source_name: str, target_name: str) -> str:
    return f"{source_name} + {target_name}"[:120]


def new_share_token() -> str:
    return secrets.token_urlsafe(16)


def reorder_items(items: list[dict[str, Any]], ordered_ids: list[str]) -> list[dict[str, Any]]:
    by_id = {str(i["id"]): i for i in items}
    ordered: list[dict[str, Any]] = []
    for idx, item_id in enumerate(ordered_ids):
        row = by_id.get(item_id)
        if not row:
            continue
        ordered.append({**row, "sort_order": idx})
    remaining = [i for i in items if str(i["id"]) not in set(ordered_ids)]
    for offset, row in enumerate(remaining):
        ordered.append({**row, "sort_order": len(ordered_ids) + offset})
    return ordered


def item_snapshot_from_product(product: dict[str, Any]) -> dict[str, Any]:
    images = product.get("images") or []
    image = images[0] if images else product.get("image")
    return {
        "id": str(product.get("id") or product.get("product_id") or ""),
        "name": product.get("name"),
        "price_cents": int(product.get("price_cents") or 0),
        "image": image,
        "store_id": str(product.get("store_id") or ""),
        "category": product.get("category"),
    }
