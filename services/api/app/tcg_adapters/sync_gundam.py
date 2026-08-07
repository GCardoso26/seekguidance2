"""Sync Gundam Card Game (apitcg GitHub data) → card_catalog."""

from __future__ import annotations

from typing import Any

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.tcg_adapters.sync_common import maybe_commit_batch, normalize_name, upsert_card, upsert_set
from app.tcg_adapters.sync_github_apitcg import fetch_apitcg_repo_cards, resolve_apitcg_set

APITCG_REPO = "gundam-tcg-data"
# Dump agregado: reimprime cartas de GD/ST com set.id=beta → conflita em (game_code, external_id).
BETA_FILE_SET = "beta"


def _gundam_image(card: dict[str, Any]) -> str | None:
    images = card.get("images") or {}
    if isinstance(images, dict):
        return images.get("large") or images.get("small")
    return None


def _external_id(card: dict[str, Any], fallback: int) -> str:
    return str(card.get("id") or card.get("code") or fallback)


def partition_gundam_cards(
    cards: list[dict[str, Any]],
) -> tuple[list[dict[str, Any]], list[dict[str, Any]], int]:
    """Separa dumps autoritativos de `beta.json`.

    Returns:
        (authoritative, beta_only, skipped_beta_duplicates)
    """
    authoritative: list[dict[str, Any]] = []
    beta_rows: list[dict[str, Any]] = []
    for card in cards:
        if str(card.get("_file_set") or "").strip().lower() == BETA_FILE_SET:
            beta_rows.append(card)
        else:
            authoritative.append(card)

    seen = {_external_id(c, i) for i, c in enumerate(authoritative)}
    beta_only: list[dict[str, Any]] = []
    skipped = 0
    for i, card in enumerate(beta_rows):
        ext = _external_id(card, i)
        if ext in seen:
            skipped += 1
            continue
        seen.add(ext)
        beta_only.append(card)
    return authoritative, beta_only, skipped


async def sync_gundam(session: AsyncSession, *, limit: int | None = None) -> dict[str, Any]:
    count = 0
    batch = 0
    sets_synced = 0
    seen_sets: set[str] = set()

    async with httpx.AsyncClient(timeout=120.0) as client:
        cards = await fetch_apitcg_repo_cards(client, APITCG_REPO)
        if not cards:
            return {"status": "error", "message": "No Gundam cards from apitcg GitHub"}

        authoritative, beta_only, skipped_beta_dupes = partition_gundam_cards(cards)
        ordered = [*authoritative, *beta_only]
        source_rows = len(cards)

        for card in ordered:
            if limit is not None and count >= limit:
                break
            set_code, set_name = resolve_apitcg_set(card, default_code="GD")
            if set_code not in seen_sets:
                await upsert_set(
                    session,
                    game_code="GUNDAM",
                    code=set_code,
                    name=str(set_name),
                    external_id=set_code,
                )
                seen_sets.add(set_code)
                sets_synced += 1

            name = str(card.get("name") or "Unknown")
            ext_id = _external_id(card, count)
            image = _gundam_image(card)

            await upsert_card(
                session,
                {
                    "game_code": "GUNDAM",
                    "external_id": ext_id,
                    "name": name,
                    "normalized_name": normalize_name(name),
                    "set_code": set_code,
                    "set_name": str(set_name),
                    "card_number": str(card.get("code") or ""),
                    "rarity": card.get("rarity"),
                    "card_type": card.get("cardType"),
                    "image_url": image,
                    "image_uris": {"normal": image} if image else {},
                    "source": "apitcg",
                    "external_ids": {"apitcg": ext_id},
                    "game_data": {
                        "color": card.get("color"),
                        "cost": card.get("cost"),
                        "level": card.get("level"),
                        "ap": card.get("ap"),
                        "hp": card.get("hp"),
                        "zone": card.get("zone"),
                        "trait": card.get("trait"),
                        "link": card.get("link"),
                        "effect": card.get("effect"),
                        "source_title": card.get("sourceTitle"),
                    },
                },
            )
            count += 1
            batch = await maybe_commit_batch(session, batch + 1)

    if batch:
        await session.commit()
    return {
        "status": "ok",
        "game": "GUNDAM",
        "synced": count,
        "sets_synced": sets_synced,
        "source_rows": source_rows,
        "skipped_beta_duplicates": skipped_beta_dupes,
        "beta_only": len(beta_only),
        "source": "apitcg-github",
    }
