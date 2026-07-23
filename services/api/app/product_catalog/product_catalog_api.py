"""Catálogo Mestre — produtos selados e acessórios."""

from __future__ import annotations

import json
from datetime import UTC, datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Header, Query
from sqlalchemy import text

from app.api.deps import DbSession
from app.api.deps_admin import require_admin
from app.api.v1.tournament_system import _require_user
from app.marketplace import seller_dashboard as seller_dash
from app.marketplace import shop_products as shop_products_svc

router = APIRouter(tags=["product-catalog"])


@router.get("/runtime/judge/product-catalog/taxonomy")
async def product_catalog_taxonomy() -> dict[str, Any]:
    """Categorias/subcategorias oficiais (espelho do domínio TS)."""
    from app.product_catalog.taxonomy import OFFICIAL_TAXONOMY

    return {"taxonomy": OFFICIAL_TAXONOMY, "generated_at": datetime.now(UTC).isoformat()}


@router.get("/runtime/judge/product-catalog/search")
async def search_master_products(
    session: DbSession,
    q: str = Query("", min_length=0),
    category: str | None = Query(default=None),
    game: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=24, ge=1, le=100),
) -> dict[str, Any]:
    offset = (page - 1) * limit
    params: dict[str, Any] = {"limit": limit, "offset": offset}
    where = ["1=1"]
    if q.strip():
        where.append(
            """(
              p.search_vector @@ plainto_tsquery('portuguese', :q_plain)
              OR p.title_pt % :q_plain
              OR p.normalized_title ILIKE :q_norm
              OR p.sku ILIKE :q
              OR EXISTS (
                SELECT 1 FROM product_catalog.product_games pg
                JOIN product_catalog.games g ON g.id = pg.game_id
                WHERE pg.product_id = p.id AND g.code ILIKE :q_game
              )
            )"""
        )
        params["q_plain"] = q.strip()
        params["q_norm"] = f"%{q.strip().lower()}%"
        params["q"] = f"%{q.strip()}%"
        params["q_game"] = f"%{q.strip().upper()}%"
    if category:
        where.append("p.category = :category")
        params["category"] = category
    if game:
        where.append(
            """EXISTS (
              SELECT 1 FROM product_catalog.product_games pg
              JOIN product_catalog.games g ON g.id = pg.game_id
              WHERE pg.product_id = p.id AND g.code = :game
            )"""
        )
        params["game"] = game.upper()
    sql = f"""
        SELECT
          p.id AS product_id,
          p.title_pt,
          p.category,
          p.product_type,
          p.subcategory,
          p.game,
          p.sku,
          v.id AS variant_id,
          v.variant_name,
          (
            SELECT a.cdn_url FROM media.asset_links l
            JOIN media.assets a ON a.id = l.asset_id
            WHERE l.entity_type = 'product_variant' AND l.entity_id = v.id
            ORDER BY CASE l.role WHEN 'primary' THEN 0 ELSE 1 END, l.sort_order
            LIMIT 1
          ) AS image_url
        FROM product_catalog.products p
        JOIN product_catalog.variants v ON v.product_id = p.id
        WHERE {" AND ".join(where)}
        ORDER BY p.title_pt ASC
        LIMIT :limit OFFSET :offset
    """
    try:
        res = await session.execute(text(sql), params)
        rows = [dict(r._mapping) for r in res.fetchall()]
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"product_catalog_unavailable:{exc}") from exc
    return {"items": rows, "page": page, "limit": limit}


@router.get("/runtime/judge/product-catalog/admin/stats")
async def product_catalog_admin_stats(
    session: DbSession,
    _admin_id: str = Depends(require_admin),
) -> dict[str, Any]:
    try:
        counts = await session.execute(
            text(
                """
                SELECT
                  (SELECT count(*) FROM product_catalog.products) AS products,
                  (SELECT count(*) FROM product_catalog.variants) AS variants,
                  (SELECT count(*) FROM media.assets) AS assets,
                  (SELECT count(*) FROM media.asset_links) AS asset_links,
                  (SELECT count(*) FROM product_catalog.manufacturers) AS manufacturers,
                  (SELECT count(*) FROM product_catalog.brands) AS brands,
                  (SELECT count(*) FROM product_catalog.games) AS games,
                  (SELECT count(*) FROM product_catalog.collections) AS collections
                """
            )
        )
        row = dict(counts.fetchone()._mapping)
        avg_sync = await session.execute(
            text(
                """
                SELECT avg(duration_ms)::int AS avg_duration_ms
                FROM product_catalog.sync_runs
                WHERE duration_ms IS NOT NULL AND started_at > now() - interval '30 days'
                """
            )
        )
        avg_ms = avg_sync.scalar()
        if avg_ms is not None:
            row["avg_sync_duration_ms"] = avg_ms
        providers = await session.execute(
            text(
                """
                SELECT provider_id, category, last_sync_at, last_status, last_error
                FROM product_catalog.provider_registry
                ORDER BY updated_at DESC
                LIMIT 30
                """
            )
        )
        by_cat = await session.execute(
            text(
                """
                SELECT category, count(*) AS total
                FROM product_catalog.products
                GROUP BY category
                ORDER BY total DESC
                """
            )
        )
        by_mfr = await session.execute(
            text(
                """
                SELECT m.name, count(p.id) AS total
                FROM product_catalog.manufacturers m
                LEFT JOIN product_catalog.products p ON p.manufacturer_id = m.id
                GROUP BY m.name
                ORDER BY total DESC
                LIMIT 20
                """
            )
        )
        last_sync = await session.execute(
            text(
                """
                SELECT job_key, provider_id, status, started_at, finished_at, items_upserted, errors
                FROM product_catalog.sync_runs
                ORDER BY started_at DESC
                LIMIT 10
                """
            )
        )
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"product_catalog_unavailable:{exc}") from exc

    return {
        "counts": row,
        "by_category": [dict(r._mapping) for r in by_cat.fetchall()],
        "by_manufacturer": [dict(r._mapping) for r in by_mfr.fetchall()],
        "recent_syncs": [dict(r._mapping) for r in last_sync.fetchall()],
        "providers": [dict(r._mapping) for r in providers.fetchall()],
        "generated_at": datetime.now(UTC).isoformat(),
    }


@router.get("/runtime/judge/product-catalog/admin/asset-ingestion-coverage")
async def product_catalog_asset_ingestion_coverage(
    session: DbSession,
    _admin_id: str = Depends(require_admin),
) -> dict[str, Any]:
    """Métricas de cobertura de imagens oficiais (acessórios + selados)."""
    has_image = """
      EXISTS (
        SELECT 1 FROM product_catalog.variants v
        JOIN media.asset_links l ON l.entity_id = v.id AND l.entity_type = 'product_variant'
        WHERE v.product_id = p.id
      )
    """
    try:
        domain = await session.execute(
            text(
                f"""
                SELECT
                  CASE WHEN p.category = 'SEALED_PRODUCT' THEN 'sealed' ELSE 'accessories' END AS domain,
                  count(*) AS total,
                  count(*) FILTER (WHERE {has_image}) AS with_image
                FROM product_catalog.products p
                GROUP BY 1
                """
            )
        )
        without = await session.execute(
            text(f"SELECT count(*) AS c FROM product_catalog.products p WHERE NOT ({has_image})")
        )
        by_cat = await session.execute(
            text(
                f"""
                SELECT p.category, count(*) AS total,
                       count(*) FILTER (WHERE {has_image}) AS with_image
                FROM product_catalog.products p
                GROUP BY p.category ORDER BY count(*) DESC
                """
            )
        )
        by_mfr = await session.execute(
            text(
                f"""
                SELECT coalesce(m.name, 'unknown') AS name, count(p.id) AS total,
                       count(p.id) FILTER (WHERE {has_image}) AS with_image
                FROM product_catalog.products p
                LEFT JOIN product_catalog.manufacturers m ON m.id = p.manufacturer_id
                WHERE p.category <> 'SEALED_PRODUCT'
                GROUP BY 1 ORDER BY count(p.id) DESC LIMIT 50
                """
            )
        )
        by_pub = await session.execute(
            text(
                f"""
                SELECT coalesce(m.name, 'unknown') AS name, count(p.id) AS total,
                       count(p.id) FILTER (WHERE {has_image}) AS with_image
                FROM product_catalog.products p
                LEFT JOIN product_catalog.manufacturers m ON m.id = p.manufacturer_id
                WHERE p.category = 'SEALED_PRODUCT'
                GROUP BY 1 ORDER BY count(p.id) DESC LIMIT 50
                """
            )
        )
        by_game = await session.execute(
            text(
                f"""
                SELECT coalesce(g.code, coalesce(p.game, 'NONE')) AS code,
                       count(DISTINCT p.id) AS total,
                       count(DISTINCT p.id) FILTER (WHERE {has_image}) AS with_image
                FROM product_catalog.products p
                LEFT JOIN product_catalog.product_games pg ON pg.product_id = p.id
                LEFT JOIN product_catalog.games g ON g.id = pg.game_id
                WHERE p.category = 'SEALED_PRODUCT'
                GROUP BY 1 ORDER BY count(DISTINCT p.id) DESC LIMIT 50
                """
            )
        )
        by_exp = await session.execute(
            text(
                f"""
                SELECT coalesce(c.name, 'unknown') AS name, count(p.id) AS total,
                       count(p.id) FILTER (WHERE {has_image}) AS with_image
                FROM product_catalog.products p
                LEFT JOIN product_catalog.collections c ON c.id = p.collection_id
                WHERE p.category = 'SEALED_PRODUCT'
                GROUP BY 1 ORDER BY count(p.id) DESC LIMIT 50
                """
            )
        )
        dups = await session.execute(
            text(
                """
                SELECT count(*) AS c FROM (
                  SELECT a.sha256 FROM media.assets a
                  JOIN media.asset_links l ON l.asset_id = a.id
                  GROUP BY a.sha256 HAVING count(l.id) > 1
                ) d
                """
            )
        )
        orphans = await session.execute(
            text(
                """
                SELECT count(*) AS c FROM media.assets a
                WHERE NOT EXISTS (SELECT 1 FROM media.asset_links l WHERE l.asset_id = a.id)
                """
            )
        )
        quality = await session.execute(
            text("SELECT avg(quality_score) AS avg FROM product_catalog.products WHERE quality_score IS NOT NULL")
        )
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"product_catalog_unavailable:{exc}") from exc

    def cov_rows(rows: Any, key: str) -> list[dict[str, Any]]:
        out: list[dict[str, Any]] = []
        for r in rows:
            d = dict(r._mapping)
            total = int(d.get("total") or 0)
            with_image = int(d.get("with_image") or 0)
            out.append(
                {
                    key: d.get(key),
                    "total": total,
                    "withImage": with_image,
                    "coveragePct": round((with_image / total) * 100, 1) if total else 0,
                }
            )
        return out

    accessories = {"total": 0, "withImage": 0, "coveragePct": 0.0}
    sealed = {"total": 0, "withImage": 0, "coveragePct": 0.0}
    for r in domain.fetchall():
        d = dict(r._mapping)
        bucket = sealed if d["domain"] == "sealed" else accessories
        total = int(d["total"] or 0)
        with_image = int(d["with_image"] or 0)
        bucket["total"] = total
        bucket["withImage"] = with_image
        bucket["coveragePct"] = round((with_image / total) * 100, 1) if total else 0

    avg_q = quality.scalar()
    by_mfr_rows = cov_rows(by_mfr.fetchall(), "name")
    by_pub_rows = cov_rows(by_pub.fetchall(), "name")
    return {
        "accessories": accessories,
        "sealed": sealed,
        "productsWithoutImage": int(without.scalar() or 0),
        "byManufacturer": by_mfr_rows,
        "byPublisher": by_pub_rows,
        "byGame": cov_rows(by_game.fetchall(), "code"),
        "byExpansion": cov_rows(by_exp.fetchall(), "name"),
        "byCategory": cov_rows(by_cat.fetchall(), "category"),
        "duplicateAssets": int(dups.scalar() or 0),
        "orphanAssets": int(orphans.scalar() or 0),
        "averageImageQuality": float(avg_q or 0),
        "averageAssetScore": 0.0,
        "topManufacturers": by_mfr_rows[:10],
        "topPublishers": by_pub_rows[:10],
        "assetsReplaced": 0,
        "assetsUpdated": 0,
        "coverageHistory": [],
        "generated_at": datetime.now(UTC).isoformat(),
    }


@router.get("/runtime/judge/product-catalog/admin/asset-health")
async def product_catalog_asset_health(
    session: DbSession,
    _admin_id: str = Depends(require_admin),
) -> dict[str, Any]:
    """Asset Health admin report — DTO only for Runtime Console (no full dashboard)."""
    has_image = """
      EXISTS (
        SELECT 1 FROM product_catalog.variants v
        JOIN media.asset_links l ON l.entity_id = v.id AND l.entity_type = 'product_variant'
        WHERE v.product_id = p.id
      )
    """
    try:
        total_assets = await session.execute(text("SELECT count(*) AS c FROM media.assets"))
        healthy = await session.execute(
            text(
                """
                SELECT count(*) AS c FROM media.assets
                WHERE cdn_url IS NOT NULL AND sha256 IS NOT NULL
                  AND derivatives IS NOT NULL AND derivatives <> '{}'::jsonb
                """
            )
        )
        orphans = await session.execute(
            text(
                """
                SELECT count(*) AS c FROM media.assets a
                WHERE NOT EXISTS (SELECT 1 FROM media.asset_links l WHERE l.asset_id = a.id)
                """
            )
        )
        dups = await session.execute(
            text(
                """
                SELECT count(*) AS c FROM (
                  SELECT sha256 FROM media.assets GROUP BY sha256 HAVING count(*) > 1
                ) d
                """
            )
        )
        missing_hero = await session.execute(
            text(
                f"""
                SELECT count(*) AS c FROM product_catalog.products p
                WHERE p.category = 'SEALED_PRODUCT' AND NOT ({has_image})
                """
            )
        )
        missing_gallery = await session.execute(
            text(
                """
                SELECT count(*) AS c FROM product_catalog.products p
                WHERE NOT EXISTS (
                  SELECT 1 FROM product_catalog.variants v
                  JOIN media.asset_links l ON l.entity_id = v.id AND l.entity_type = 'product_variant'
                  WHERE v.product_id = p.id AND l.role = 'gallery'
                )
                """
            )
        )
        missing_deriv = await session.execute(
            text(
                "SELECT count(*) AS c FROM media.assets WHERE derivatives IS NULL OR derivatives = '{}'::jsonb"
            )
        )
        missing_meta = await session.execute(
            text("SELECT count(*) AS c FROM media.assets WHERE derivatives->'_meta' IS NULL")
        )
        by_game = await session.execute(
            text(
                """
                SELECT coalesce(g.code, coalesce(p.game, 'NONE')) AS code, count(DISTINCT a.id) AS assets
                FROM product_catalog.products p
                LEFT JOIN product_catalog.product_games pg ON pg.product_id = p.id
                LEFT JOIN product_catalog.games g ON g.id = pg.game_id
                JOIN product_catalog.variants v ON v.product_id = p.id
                JOIN media.asset_links l ON l.entity_id = v.id AND l.entity_type = 'product_variant'
                JOIN media.assets a ON a.id = l.asset_id
                GROUP BY 1 ORDER BY count(DISTINCT a.id) DESC LIMIT 30
                """
            )
        )
        by_mfr = await session.execute(
            text(
                """
                SELECT coalesce(m.name, 'unknown') AS name, count(DISTINCT a.id) AS assets
                FROM product_catalog.products p
                LEFT JOIN product_catalog.manufacturers m ON m.id = p.manufacturer_id
                JOIN product_catalog.variants v ON v.product_id = p.id
                JOIN media.asset_links l ON l.entity_id = v.id AND l.entity_type = 'product_variant'
                JOIN media.assets a ON a.id = l.asset_id
                WHERE p.category <> 'SEALED_PRODUCT'
                GROUP BY 1 ORDER BY count(DISTINCT a.id) DESC LIMIT 30
                """
            )
        )
        by_pub = await session.execute(
            text(
                """
                SELECT coalesce(m.name, 'unknown') AS name, count(DISTINCT a.id) AS assets
                FROM product_catalog.products p
                LEFT JOIN product_catalog.manufacturers m ON m.id = p.manufacturer_id
                JOIN product_catalog.variants v ON v.product_id = p.id
                JOIN media.asset_links l ON l.entity_id = v.id AND l.entity_type = 'product_variant'
                JOIN media.assets a ON a.id = l.asset_id
                WHERE p.category = 'SEALED_PRODUCT'
                GROUP BY 1 ORDER BY count(DISTINCT a.id) DESC LIMIT 30
                """
            )
        )
        by_type = await session.execute(
            text(
                """
                SELECT coalesce(l.role, 'unknown') AS type, count(*) AS assets
                FROM media.asset_links l
                GROUP BY 1 ORDER BY count(*) DESC LIMIT 30
                """
            )
        )
        by_exp = await session.execute(
            text(
                """
                SELECT coalesce(c.name, 'unknown') AS name, count(DISTINCT a.id) AS assets
                FROM product_catalog.products p
                LEFT JOIN product_catalog.collections c ON c.id = p.collection_id
                JOIN product_catalog.variants v ON v.product_id = p.id
                JOIN media.asset_links l ON l.entity_id = v.id AND l.entity_type = 'product_variant'
                JOIN media.assets a ON a.id = l.asset_id
                WHERE p.category = 'SEALED_PRODUCT'
                GROUP BY 1 ORDER BY count(DISTINCT a.id) DESC LIMIT 30
                """
            )
        )
        quality_dist = await session.execute(
            text(
                """
                SELECT CASE
                  WHEN qs >= 90 THEN '90-100'
                  WHEN qs >= 70 THEN '70-89'
                  WHEN qs >= 50 THEN '50-69'
                  ELSE '0-49'
                END AS bucket, count(*) AS count
                FROM (
                  SELECT coalesce((derivatives->'_meta'->>'assetQualityScore')::int, 0) AS qs
                  FROM media.assets
                ) q GROUP BY 1 ORDER BY 1
                """
            )
        )
        trust_dist = await session.execute(
            text(
                """
                SELECT coalesce((derivatives->'_meta'->>'sourcePriority')::int, 0) AS trust,
                       count(*) AS count
                FROM media.assets
                GROUP BY 1 ORDER BY 1 DESC LIMIT 20
                """
            )
        )
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"product_catalog_unavailable:{exc}") from exc

    total = int(total_assets.scalar() or 0)
    healthy_n = int(healthy.scalar() or 0)
    overall = round((healthy_n / total) * 100, 1) if total else 0.0

    def bucket_rows(rows: Any, key: str) -> list[dict[str, Any]]:
        out = []
        for r in rows:
            d = dict(r._mapping)
            out.append({key: d.get(key), "healthPct": overall, "assets": int(d.get("assets") or 0)})
        return out

    return {
        "overall": overall,
        "perPublisher": bucket_rows(by_pub.fetchall(), "name"),
        "perManufacturer": bucket_rows(by_mfr.fetchall(), "name"),
        "perGame": bucket_rows(by_game.fetchall(), "code"),
        "perExpansion": bucket_rows(by_exp.fetchall(), "name"),
        "perAssetType": bucket_rows(by_type.fetchall(), "type"),
        "orphans": int(orphans.scalar() or 0),
        "duplicates": int(dups.scalar() or 0),
        "missingHero": int(missing_hero.scalar() or 0),
        "missingGallery": int(missing_gallery.scalar() or 0),
        "missingDerivatives": int(missing_deriv.scalar() or 0),
        "missingMetadata": int(missing_meta.scalar() or 0),
        "qualityDistribution": [dict(r._mapping) for r in quality_dist.fetchall()],
        "trustDistribution": [dict(r._mapping) for r in trust_dist.fetchall()],
        "generated_at": datetime.now(UTC).isoformat(),
    }


@router.get("/runtime/judge/product-catalog/products/{product_id}/relationships")
async def product_catalog_product_relationships(
    session: DbSession,
    product_id: str,
    limit: int = Query(default=24, ge=1, le=100),
) -> dict[str, Any]:
    """Official related products for Marketplace PDP (no AI)."""
    try:
        res = await session.execute(
            text(
                """
                SELECT
                  p.id AS product_id,
                  p.title_pt,
                  p.category,
                  p.subcategory,
                  r.relation_type,
                  r.confidence,
                  (
                    SELECT a.cdn_url
                    FROM product_catalog.variants v
                    JOIN media.asset_links l ON l.entity_id = v.id AND l.entity_type = 'product_variant'
                    JOIN media.assets a ON a.id = l.asset_id
                    WHERE v.product_id = p.id
                    ORDER BY CASE l.role WHEN 'primary' THEN 0 ELSE 1 END, l.sort_order
                    LIMIT 1
                  ) AS image_url
                FROM product_catalog.product_relationships r
                JOIN product_catalog.products p ON p.id = r.to_product_id
                WHERE r.from_product_id = CAST(:pid AS uuid) AND r.official = true
                ORDER BY r.confidence DESC, p.title_pt ASC
                LIMIT :limit
                """
            ),
            {"pid": product_id, "limit": limit},
        )
        items = [dict(r._mapping) for r in res.fetchall()]
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"product_catalog_unavailable:{exc}") from exc
    return {"product_id": product_id, "items": items, "generated_at": datetime.now(UTC).isoformat()}


@router.get("/runtime/judge/product-catalog/assets/{asset_id}/versions")
async def product_catalog_asset_versions(session: DbSession, asset_id: str) -> dict[str, Any]:
    """Asset version history (Product Catalog extension — no Asset BC API change)."""
    try:
        res = await session.execute(
            text(
                """
                SELECT id, asset_id, entity_type, entity_id, version_number, source, source_trust,
                       quality_score, sha256, width, height, format, size_bytes, cdn_url,
                       pipeline_version, created_by, created_at, is_current
                FROM product_catalog.asset_version_history
                WHERE asset_id = CAST(:aid AS uuid)
                ORDER BY version_number DESC
                """
            ),
            {"aid": asset_id},
        )
        items = [dict(r._mapping) for r in res.fetchall()]
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"product_catalog_unavailable:{exc}") from exc
    return {"asset_id": asset_id, "versions": items}


@router.get("/runtime/judge/product-catalog/products/{product_id}/knowledge")
async def product_catalog_product_knowledge(session: DbSession, product_id: str) -> dict[str, Any]:
    """Product Knowledge Graph aggregate for Marketplace PDP / Portal (official only, no AI)."""
    try:
        prod = await session.execute(
            text(
                """
                SELECT p.id, p.title_pt, p.category, p.subcategory, p.game, p.lifecycle,
                       p.product_family, p.collection_id, p.knowledge_completeness,
                       c.name AS collection_name, c.slug AS collection_slug,
                       pub.code AS publisher_code, pub.name AS publisher_name
                FROM product_catalog.products p
                LEFT JOIN product_catalog.collections c ON c.id = p.collection_id
                LEFT JOIN product_catalog.publishers pub ON pub.id = p.publisher_id
                WHERE p.id = CAST(:pid AS uuid)
                """
            ),
            {"pid": product_id},
        )
        prow = prod.fetchone()
        if not prow:
            raise HTTPException(status_code=404, detail="product_not_found")
        p = dict(prow._mapping)

        contents_h = await session.execute(
            text("SELECT * FROM product_catalog.official_product_contents WHERE product_id = CAST(:pid AS uuid)"),
            {"pid": product_id},
        )
        ch = contents_h.fetchone()
        official_contents = None
        if ch:
            items = await session.execute(
                text(
                    """
                    SELECT id, content_type, label, quantity, unit, sku_ref, sort_order
                    FROM product_catalog.product_content_items
                    WHERE contents_id = :cid ORDER BY sort_order, label
                    """
                ),
                {"cid": ch.id},
            )
            official_contents = {**dict(ch._mapping), "items": [dict(r._mapping) for r in items.fetchall()]}

        specs = await session.execute(
            text(
                """
                SELECT * FROM product_catalog.product_specifications
                WHERE product_id = CAST(:pid AS uuid) ORDER BY spec_schema
                """
            ),
            {"pid": product_id},
        )
        meta = await session.execute(
            text("SELECT * FROM product_catalog.product_official_metadata WHERE product_id = CAST(:pid AS uuid)"),
            {"pid": product_id},
        )
        pkgs = await session.execute(
            text(
                """
                SELECT * FROM product_catalog.product_asset_packages
                WHERE product_id = CAST(:pid AS uuid) ORDER BY package_kind
                """
            ),
            {"pid": product_id},
        )
        entity_rels = await session.execute(
            text(
                """
                SELECT relation_type, to_entity_type, to_entity_ref, to_game_code, confidence
                FROM product_catalog.product_relationships
                WHERE from_product_id = CAST(:pid AS uuid) AND official = true AND to_product_id IS NULL
                ORDER BY confidence DESC
                """
            ),
            {"pid": product_id},
        )
        collection_products: list[dict[str, Any]] = []
        if p.get("collection_id"):
            cp = await session.execute(
                text(
                    """
                    SELECT id, title_pt, category, subcategory, lifecycle, product_family, sku
                    FROM product_catalog.products
                    WHERE collection_id = CAST(:cid AS uuid)
                    ORDER BY title_pt LIMIT 48
                    """
                ),
                {"cid": p["collection_id"]},
            )
            collection_products = [dict(r._mapping) for r in cp.fetchall()]

        specs_rows = [dict(r._mapping) for r in specs.fetchall()]
        pkgs_rows = [dict(r._mapping) for r in pkgs.fetchall()]
        entity_rows = [dict(r._mapping) for r in entity_rels.fetchall()]
        asset_packages = pkgs_rows
        downloads = [a for a in asset_packages if a.get("package_kind") in (
            "pdf", "rules", "decklist", "marketing_kit", "release_notes", "press_kit",
        )]
        marketing = [a for a in asset_packages if a.get("package_kind") in (
            "marketing_kit", "banners", "social", "editorial", "press_kit",
        )]
        meta_row = meta.fetchone()
        metadata = dict(meta_row._mapping) if meta_row else None
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"product_catalog_unavailable:{exc}") from exc

    return {
        "product_id": product_id,
        "title_pt": p.get("title_pt"),
        "taxonomy": {
            "publisher": p.get("publisher_code"),
            "game": p.get("game"),
            "category": p.get("category"),
            "subcategory": p.get("subcategory"),
            "product_family": p.get("product_family"),
            "lifecycle": p.get("lifecycle"),
        },
        "lifecycle": p.get("lifecycle"),
        "collection": (
            {
                "id": str(p["collection_id"]),
                "name": p.get("collection_name"),
                "slug": p.get("collection_slug"),
                "products": collection_products,
            }
            if p.get("collection_id")
            else None
        ),
        "official_contents": official_contents,
        "specifications": specs_rows,
        "metadata": metadata,
        "entity_relationships": entity_rows,
        "asset_packages": asset_packages,
        "downloads": downloads,
        "marketing_files": marketing,
        "release_information": {
            "release_date": (metadata or {}).get("release_date"),
            "msrp_cents": (metadata or {}).get("msrp_cents") or (official_contents or {}).get("msrp_cents"),
            "language": (metadata or {}).get("language"),
            "country": (metadata or {}).get("country"),
            "expansion": (metadata or {}).get("expansion"),
            "series": (metadata or {}).get("series"),
        },
        "knowledge_completeness": float(p.get("knowledge_completeness") or 0),
        "generated_at": datetime.now(UTC).isoformat(),
    }


@router.get("/runtime/judge/product-catalog/collections/{slug}")
async def product_catalog_collection_by_slug(session: DbSession, slug: str) -> dict[str, Any]:
    """Portal — official collection graph node."""
    try:
        col = await session.execute(
            text("SELECT * FROM product_catalog.collections WHERE slug = :slug LIMIT 1"),
            {"slug": slug},
        )
        crow = col.fetchone()
        if not crow:
            raise HTTPException(status_code=404, detail="collection_not_found")
        c = dict(crow._mapping)
        products = await session.execute(
            text(
                """
                SELECT id, title_pt, category, subcategory, lifecycle, product_family, sku
                FROM product_catalog.products
                WHERE collection_id = CAST(:cid AS uuid)
                ORDER BY title_pt
                """
            ),
            {"cid": c["id"]},
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"product_catalog_unavailable:{exc}") from exc
    return {
        "collection": c,
        "products": [dict(r._mapping) for r in products.fetchall()],
        "generated_at": datetime.now(UTC).isoformat(),
    }


@router.get("/runtime/judge/product-catalog/admin/knowledge-coverage")
async def product_catalog_knowledge_coverage(
    session: DbSession,
    _admin_id: str = Depends(require_admin),
) -> dict[str, Any]:
    """Knowledge coverage analytics — admin only, read-only (no snapshot write)."""
    try:
        report = await _compute_knowledge_coverage(session)
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"product_catalog_unavailable:{exc}") from exc
    return report


@router.post("/runtime/judge/product-catalog/admin/knowledge-coverage/refresh")
async def product_catalog_knowledge_coverage_refresh(
    session: DbSession,
    _admin_id: str = Depends(require_admin),
) -> dict[str, Any]:
    """Persist a knowledge coverage snapshot (admin + scheduler only)."""
    try:
        report = await _compute_knowledge_coverage(session)
        await session.execute(
            text(
                """
                INSERT INTO product_catalog.knowledge_coverage_snapshots (overall_pct, report)
                VALUES (:pct, CAST(:report AS jsonb))
                """
            ),
            {"pct": report["overallPct"], "report": json.dumps(report)},
        )
        await session.commit()
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"product_catalog_unavailable:{exc}") from exc
    return report


async def _compute_knowledge_coverage(session: DbSession) -> dict[str, Any]:
    totals = await session.execute(
        text(
            """
            SELECT
              (SELECT count(*) FROM product_catalog.products) AS products,
              (SELECT count(*) FROM product_catalog.official_product_contents) AS with_contents,
              (SELECT count(DISTINCT product_id) FROM product_catalog.product_specifications) AS with_specs,
              (SELECT count(*) FROM product_catalog.product_official_metadata) AS with_metadata,
              (SELECT count(*) FROM product_catalog.products WHERE lifecycle IS NOT NULL) AS with_lifecycle,
              (SELECT count(*) FROM product_catalog.products
                 WHERE lifecycle IS NOT NULL AND lifecycle <> 'AVAILABLE') AS with_lifecycle_non_default,
              (SELECT count(*) FROM product_catalog.product_official_metadata
                 WHERE lifecycle IS NOT NULL AND lifecycle <> '') AS with_lifecycle_metadata,
              (SELECT count(*) FROM product_catalog.products WHERE collection_id IS NOT NULL) AS with_collection,
              (SELECT count(DISTINCT product_id) FROM product_catalog.product_asset_packages) AS with_asset_pkg,
              (SELECT coalesce(avg(knowledge_completeness), 0) FROM product_catalog.products) AS avg_completeness
            """
        )
    )
    t = dict(totals.fetchone()._mapping)

    def _pct(n: float, d: float) -> float:
        return round((n / d) * 100, 1) if d else 0.0

    products = float(t["products"] or 0)
    oc = _pct(float(t["with_contents"] or 0), products)
    sc = _pct(float(t["with_specs"] or 0), products)
    mc = _pct(float(t["with_metadata"] or 0), products)
    # AVAILABLE is a valid lifecycle — do not exclude (BUG-V4-007)
    lc = _pct(float(t["with_lifecycle"] or 0), products)
    cc = _pct(float(t["with_collection"] or 0), products)
    ac = _pct(float(t["with_asset_pkg"] or 0), products)
    kc = round(float(t["avg_completeness"] or 0), 1)
    slices = [oc, sc, mc, lc, cc, ac, kc]
    overall = round(sum(slices) / len(slices), 1) if slices else 0.0
    return {
        "overallPct": overall,
        "productKnowledgeCoverage": overall,
        "officialContentCoverage": oc,
        "specificationCoverage": sc,
        "metadataCoverage": mc,
        "lifecycleCoverage": lc,
        "collectionCoverage": cc,
        "assetPackageCoverage": ac,
        "knowledgeCompletenessScore": kc,
        "totals": {
            "products": int(products),
            "withContents": int(t["with_contents"] or 0),
            "withSpecs": int(t["with_specs"] or 0),
            "withMetadata": int(t["with_metadata"] or 0),
            "withLifecycleNonDefault": int(t["with_lifecycle_non_default"] or 0),
            "withLifecycleFromMetadata": int(t["with_lifecycle_metadata"] or 0),
            "withCollection": int(t["with_collection"] or 0),
            "withAssetPackage": int(t["with_asset_pkg"] or 0),
        },
        "generated_at": datetime.now(UTC).isoformat(),
    }


@router.get("/runtime/judge/catalog/products")
async def public_catalog_products(
    session: DbSession,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=24, ge=1, le=100),
) -> dict[str, Any]:
    """API pública (parceiros) — listagem paginada."""
    return await search_master_products(session, q="", page=page, limit=limit)


@router.get("/runtime/judge/catalog/variants/{variant_id}")
async def public_catalog_variant(session: DbSession, variant_id: str) -> dict[str, Any]:
    res = await session.execute(
        text(
            """
            SELECT v.*, p.title_pt, p.category, p.product_type
            FROM product_catalog.variants v
            JOIN product_catalog.products p ON p.id = v.product_id
            WHERE v.id = CAST(:id AS uuid)
            """
        ),
        {"id": variant_id},
    )
    row = res.fetchone()
    if not row:
        raise HTTPException(404, detail="not_found")
    return {"variant": dict(row._mapping)}


@router.get("/runtime/judge/catalog/search")
async def public_catalog_search(
    session: DbSession,
    q: str = Query(""),
    category: str | None = None,
    game: str | None = None,
    page: int = 1,
    limit: int = 24,
) -> dict[str, Any]:
    return await search_master_products(session, q=q, category=category, game=game, page=page, limit=limit)


@router.get("/runtime/judge/catalog/manufacturers")
async def public_catalog_manufacturers(session: DbSession) -> dict[str, Any]:
    res = await session.execute(text("SELECT id, name, website FROM product_catalog.manufacturers ORDER BY name"))
    return {"items": [dict(r._mapping) for r in res.fetchall()]}


@router.get("/runtime/judge/catalog/brands")
async def public_catalog_brands(session: DbSession) -> dict[str, Any]:
    res = await session.execute(
        text(
            """
            SELECT b.id, b.name, m.name AS manufacturer
            FROM product_catalog.brands b
            JOIN product_catalog.manufacturers m ON m.id = b.manufacturer_id
            ORDER BY b.name
            """
        )
    )
    return {"items": [dict(r._mapping) for r in res.fetchall()]}


@router.get("/runtime/judge/catalog/games")
async def public_catalog_games(session: DbSession) -> dict[str, Any]:
    res = await session.execute(text("SELECT code, name FROM product_catalog.games ORDER BY name"))
    return {"items": [dict(r._mapping) for r in res.fetchall()]}


@router.post("/runtime/judge/product-catalog/seller/listings")
async def publish_seller_master_listing(
    session: DbSession,
    body: dict[str, Any],
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    """Lojista publica oferta atrelada a variante do catálogo mestre (preço/estoque/condição)."""
    user_id = _require_user(x_judge_user_id)
    variant_id = body.get("variant_id")
    price_cents = body.get("price_cents")
    stock = body.get("stock", 0)
    condition = body.get("condition", "NEW")
    if not variant_id or not price_cents:
        raise HTTPException(status_code=400, detail="variant_id_and_price_required")
    store = await seller_dash.resolve_owner_store(session, user_id)
    store_id = str(store["id"])

    meta = await session.execute(
        text(
            """
            SELECT p.title_pt, p.category, p.subcategory, v.variant_name,
                   (
                     SELECT a.cdn_url FROM media.asset_links l
                     JOIN media.assets a ON a.id = l.asset_id
                     WHERE l.entity_type = 'product_variant' AND l.entity_id = v.id
                     ORDER BY CASE l.role WHEN 'primary' THEN 0 ELSE 1 END, l.sort_order
                     LIMIT 1
                   ) AS image_url
            FROM product_catalog.variants v
            JOIN product_catalog.products p ON p.id = v.product_id
            WHERE v.id = CAST(:vid AS uuid)
            """
        ),
        {"vid": variant_id},
    )
    meta_row = meta.fetchone()
    if not meta_row:
        raise HTTPException(status_code=404, detail="variant_not_found")

    title_pt = meta_row[0]
    category_map = {
        "SEALED_PRODUCT": "booster_box",
        "SLEEVES": "sleeve",
        "DECK_BOX": "deck_box",
        "BINDER": "album",
        "PLAYMAT": "playmat",
    }
    legacy_category = category_map.get(meta_row[1], "accessory")
    image_url = meta_row[4]

    await session.execute(
        text(
            """
            INSERT INTO product_catalog.seller_products (store_id, variant_id, stock, price_cents, condition)
            VALUES (CAST(:store_id AS uuid), CAST(:variant_id AS uuid), :stock, :price_cents, :condition)
            ON CONFLICT (store_id, variant_id, condition) DO UPDATE SET
              stock = EXCLUDED.stock,
              price_cents = EXCLUDED.price_cents,
              updated_at = now(),
              is_active = true
            """
        ),
        {
            "store_id": store_id,
            "variant_id": variant_id,
            "stock": int(stock),
            "price_cents": int(price_cents),
            "condition": condition,
        },
    )

    images = [image_url] if image_url else []
    product = await shop_products_svc.create_product(
        session,
        store_id,
        user_id,
        name=title_pt,
        description=f"{meta_row[3]} — catálogo mestre ({condition})",
        tcg_id=None,
        category=legacy_category,
        price_cents=int(price_cents),
        stock=int(stock),
        images=images,
    )
    await session.execute(
        text(
            """
            UPDATE tcg_judge.store_products
            SET master_variant_id = CAST(:variant_id AS uuid)
            WHERE id = CAST(:pid AS uuid)
            """
        ),
        {"variant_id": variant_id, "pid": product["id"]},
    )
    await session.commit()
    return {
        "ok": True,
        "seller_product_variant_id": variant_id,
        "store_product_id": product["id"],
        "condition": condition,
    }
