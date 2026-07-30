"""Ingestão idempotente por SHA256 + asset_links (ADR-009)."""

from __future__ import annotations

import hashlib
import json
import uuid
from typing import Any

import httpx
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

ALLOWED_ROLES = {
    "primary",
    "front",
    "gallery",
    "thumbnail",
    "hero",
    "banner",
    "logo",
    "icon",
    "cover",
    "lifestyle",
    "transparent",
    "share",
    "background",
    "key_art",
    "wallpaper",
    "hero_mobile",
    "hero_overlay",
    "hero_fallback",
}

ALLOWED_ENTITY_TYPES = {
    "product_variant",
    "catalog_card",
    "catalog_variant",
    "catalog_set",
    "manufacturer",
    "brand",
    "collection",
    "banner",
    "store",
    "store_product",
    "deck",
    "profile",
    "game",
    "news",
    "event",
}


def _sniff_mime(buf: bytes) -> str | None:
    if len(buf) >= 3 and buf[0] == 0xFF and buf[1] == 0xD8:
        return "image/jpeg"
    if len(buf) >= 8 and buf[0] == 0x89 and buf[1] == 0x50:
        return "image/png"
    if len(buf) >= 4 and buf[0:4] == b"RIFF":
        return "image/webp"
    return None


def _derivative_map(cdn_url: str) -> dict[str, Any]:
    base = cdn_url.rsplit(".", 1)[0] if "." in cdn_url.rsplit("/", 1)[-1] else cdn_url
    sizes = {
        "thumb": f"{base}_thumb.webp",
        "small": f"{base}_sm.webp",
        "medium": f"{base}_md.webp",
        "large": f"{base}_lg.webp",
        "full": cdn_url,
        "original": cdn_url,
    }
    return {
        **{k: {"url": v} for k, v in sizes.items()},
        "webp": {"url": sizes["medium"], "mime": "image/webp"},
        "avif": {"url": f"{base}_md.avif", "mime": "image/avif"},
        "jpeg": {"url": f"{base}_md.jpeg", "mime": "image/jpeg"},
        "thumbnail": {"url": sizes["thumb"], "mime": "image/webp"},
        "_pipeline": "asset-pipeline-v2",
    }


async def _download(url: str) -> bytes:
    async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
        res = await client.get(url)
        res.raise_for_status()
        return res.content


async def ingest_asset(
    session: AsyncSession,
    *,
    source_url: str,
    entity_type: str,
    entity_id: str,
    role: str = "front",
    sort_order: int = 0,
    request_id: str | None = None,
    media_type: str | None = None,
    alt: str | None = None,
    provider_id: str | None = None,
) -> dict[str, Any]:
    if entity_type not in ALLOWED_ENTITY_TYPES:
        raise ValueError(f"invalid_entity_type:{entity_type}")
    role_norm = role if role in ALLOWED_ROLES else "front"
    req = request_id or str(uuid.uuid4())

    raw = await _download(source_url)
    if len(raw) > 8 * 1024 * 1024:
        raise ValueError("image_too_large")
    sha256 = hashlib.sha256(raw).hexdigest()
    mime = _sniff_mime(raw)

    # Este caminho (upload de lojista) nunca envia bytes para o object storage, então não
    # pode publicar URL de R2: o objeto não existe e `cdn_url` ainda é espelhado em
    # store_products.images, o que colocaria imagem quebrada na vitrine. Quem sobe bytes é
    # o AssetMediaPipeline em TypeScript (ADR-017), com layout de chave diferente
    # (`{sha}/original.ext`, não `{sha}.webp`).
    storage_key = f"assets/{sha256[:2]}/{sha256}"
    cdn_url = source_url
    derivatives = _derivative_map(cdn_url)
    if alt or media_type or provider_id:
        derivatives["_meta"] = {
            "alt": alt,
            "mediaType": media_type,
            "provider": provider_id or "seller_upload",
            "source": source_url,
            "hash": sha256,
            "mime": mime,
        }

    existing = await session.execute(
        text("SELECT id, cdn_url, derivatives FROM media.assets WHERE sha256 = :sha LIMIT 1"),
        {"sha": sha256},
    )
    row = existing.fetchone()
    reused = row is not None

    if reused:
        asset_id = str(row[0])
        await session.execute(
            text(
                """
                UPDATE media.assets SET
                  storage_key = COALESCE(:storage_key, storage_key),
                  cdn_url = COALESCE(:cdn_url, cdn_url),
                  mime = COALESCE(:mime, mime),
                  size_bytes = COALESCE(:size_bytes, size_bytes),
                  derivatives = derivatives || CAST(:derivatives AS jsonb)
                WHERE id = CAST(:id AS uuid)
                """
            ),
            {
                "id": asset_id,
                "storage_key": storage_key,
                "cdn_url": cdn_url,
                "mime": mime,
                "size_bytes": len(raw),
                "derivatives": json.dumps(derivatives),
            },
        )
    else:
        asset_id = str(uuid.uuid4())
        await session.execute(
            text(
                """
                INSERT INTO media.assets (
                  id, sha256, storage_key, mime, size_bytes, cdn_url, derivatives
                ) VALUES (
                  CAST(:id AS uuid), :sha, :storage_key, :mime, :size_bytes, :cdn_url,
                  CAST(:derivatives AS jsonb)
                )
                """
            ),
            {
                "id": asset_id,
                "sha": sha256,
                "storage_key": storage_key,
                "mime": mime,
                "size_bytes": len(raw),
                "cdn_url": cdn_url,
                "derivatives": json.dumps(derivatives),
            },
        )

    link = await session.execute(
        text(
            """
            INSERT INTO media.asset_links (asset_id, entity_type, entity_id, role, sort_order)
            VALUES (
              CAST(:asset_id AS uuid), :entity_type, CAST(:entity_id AS uuid), :role, :sort_order
            )
            ON CONFLICT DO NOTHING
            RETURNING id
            """
        ),
        {
            "asset_id": asset_id,
            "entity_type": entity_type,
            "entity_id": entity_id,
            "role": role_norm,
            "sort_order": int(sort_order),
        },
    )
    link_created = link.fetchone() is not None

    loaded = await session.execute(
        text(
            """
            SELECT id, sha256, storage_key, width, height, mime, size_bytes, blurhash,
                   cdn_url, derivatives, created_at
            FROM media.assets WHERE id = CAST(:id AS uuid)
            """
        ),
        {"id": asset_id},
    )
    asset_row = dict(loaded.fetchone()._mapping)
    thumb = None
    deriv = asset_row.get("derivatives") or {}
    if isinstance(deriv, dict):
        thumb = (deriv.get("thumbnail") or {}).get("url") or (deriv.get("thumb") or {}).get("url")

    return {
        "ok": True,
        "request_id": req,
        "reused": reused,
        "link_created": link_created,
        "asset": {
            "id": str(asset_row["id"]),
            "sha256": asset_row["sha256"],
            "storage_key": asset_row.get("storage_key"),
            "cdn_url": asset_row.get("cdn_url"),
            "mime": asset_row.get("mime"),
            "size_bytes": asset_row.get("size_bytes"),
            "derivatives": asset_row.get("derivatives") or {},
            "thumbnail_url": thumb or asset_row.get("cdn_url"),
        },
    }


async def unlink_asset(
    session: AsyncSession,
    *,
    entity_type: str,
    entity_id: str,
    role: str | None = None,
    asset_id: str | None = None,
) -> dict[str, Any]:
    """Remove apenas o link — não apaga asset compartilhado."""
    clauses = ["entity_type = :entity_type", "entity_id = CAST(:entity_id AS uuid)"]
    params: dict[str, Any] = {"entity_type": entity_type, "entity_id": entity_id}
    if role:
        clauses.append("role = :role")
        params["role"] = role
    if asset_id:
        clauses.append("asset_id = CAST(:asset_id AS uuid)")
        params["asset_id"] = asset_id
    res = await session.execute(
        text(f"DELETE FROM media.asset_links WHERE {' AND '.join(clauses)} RETURNING id"),
        params,
    )
    removed = [str(r[0]) for r in res.fetchall()]
    return {"ok": True, "unlinked": len(removed), "link_ids": removed}


async def list_entity_assets(
    session: AsyncSession, *, entity_type: str, entity_id: str
) -> dict[str, Any]:
    res = await session.execute(
        text(
            """
            SELECT a.id, a.sha256, a.cdn_url, a.mime, a.derivatives, l.role, l.sort_order
            FROM media.asset_links l
            JOIN media.assets a ON a.id = l.asset_id
            WHERE l.entity_type = :entity_type AND l.entity_id = CAST(:entity_id AS uuid)
            ORDER BY
              CASE l.role
                WHEN 'front' THEN 0
                WHEN 'primary' THEN 0
                WHEN 'thumbnail' THEN 1
                ELSE 2
              END,
              l.sort_order ASC
            """
        ),
        {"entity_type": entity_type, "entity_id": entity_id},
    )
    items = [dict(r._mapping) for r in res.fetchall()]
    for item in items:
        item["id"] = str(item["id"])
    return {"items": items}
