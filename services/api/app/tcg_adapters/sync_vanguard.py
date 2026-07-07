"""Sync Cardfight!! Vanguard → card_catalog via CardCatalogProvider chain."""

from __future__ import annotations

from typing import Any

import structlog
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.external.providers.catalog_resolver import get_catalog_provider_for_game
from app.tcg_adapters.sync_common import maybe_commit_batch, normalize_name, upsert_card, upsert_set

logger = structlog.get_logger(__name__)


async def sync_vanguard(session: AsyncSession, *, limit: int | None = None) -> dict[str, Any]:
    providers = get_catalog_provider_for_game("VANGUARD")
    if not providers:
        return {
            "status": "error",
            "game": "VANGUARD",
            "message": "Nenhum provedor de catálogo disponível para Vanguard",
        }

    count = 0
    batch = 0
    sets_synced = 0
    seen_sets: set[str] = set()
    groups_processed = 0
    source_used: str | None = None

    for provider in providers:
        sets = await provider.list_sets("VANGUARD")
        if not sets:
            logger.info("vanguard_provider_no_sets", provider=provider.provider_id)
            continue

        source_used = provider.provider_id
        for set_ref in sets:
            if limit is not None and count >= limit:
                break

            cards = await provider.list_cards_in_set("VANGUARD", set_ref, limit=None)
            if not cards:
                continue

            groups_processed += 1
            if set_ref.code not in seen_sets:
                await upsert_set(
                    session,
                    game_code="VANGUARD",
                    code=set_ref.code,
                    name=set_ref.name,
                    external_id=set_ref.external_id,
                    release_date=set_ref.release_date,
                )
                seen_sets.add(set_ref.code)
                sets_synced += 1

            for card in cards:
                if limit is not None and count >= limit:
                    break

                image = card.image_url
                await upsert_card(
                    session,
                    {
                        "game_code": "VANGUARD",
                        "external_id": card.external_id,
                        "name": card.name,
                        "normalized_name": normalize_name(card.name),
                        "set_code": card.set_code,
                        "set_name": card.set_name,
                        "card_number": card.card_number,
                        "rarity": card.rarity,
                        "card_type": card.card_type,
                        "image_url": image,
                        "image_uris": {"normal": image} if image else {},
                        "source": card.source,
                        "external_ids": card.external_ids,
                        "price_usd": card.price_usd,
                        "game_data": card.game_data,
                    },
                )
                count += 1
                batch = await maybe_commit_batch(session, batch + 1)

        if count > 0:
            break

    if batch:
        await session.commit()

    if count == 0:
        return {
            "status": "error",
            "game": "VANGUARD",
            "message": "No Vanguard cards found via providers (tcgapi → tcgcsv fallback)",
            "providers_tried": [p.provider_id for p in providers],
        }

    return {
        "status": "ok",
        "game": "VANGUARD",
        "synced": count,
        "sets_synced": sets_synced,
        "groups_processed": groups_processed,
        "source": source_used or "unknown",
    }
