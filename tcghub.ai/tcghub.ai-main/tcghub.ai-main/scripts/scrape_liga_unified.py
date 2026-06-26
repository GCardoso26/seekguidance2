#!/usr/bin/env python3
"""
Unified Liga scraper — Playwright + Firecrawl, single script.
Covers: MTG, YGO, F&B, Riftbound, Pokémon, One Piece
Writes to: tcghub.ai Supabase (card_prices)
"""

import asyncio
import json
import os
import re
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import quote

import httpx
from playwright.async_api import async_playwright
from supabase import create_client

# ── config ──────────────────────────────────────────────────
SUPABASE_URL = os.environ["TCGHUB_SUPABASE_URL"]
SUPABASE_KEY = os.environ["TCGHUB_SERVICE_ROLE_KEY"]
FIRECRAWL_KEY = os.environ.get("FIRECRAWL_API_KEY", "").strip()
FIRECRAWL_URL = "https://api.firecrawl.dev/v2/scrape"

# how many cards per game per run (set low for testing, high for batch)
CARDS_PER_GAME = int(os.environ.get("SCRAPE_CARDS_PER_GAME", "500"))
DELAY_PLAYWRIGHT = 0.8  # seconds between playwright requests
DELAY_FIRECRAWL = 1.5   # seconds between firecrawl requests

# ── game → liga site mapping ─────────────────────────────────
GAME_SITES = {
    "mtg": {
        "site": "ligamagic.com.br",
        "method": "playwright",
        "search_url": "https://www.ligamagic.com.br/?view=cards/search&card={name}",
        "card_url_template": "https://www.ligamagic.com.br/?view=cards/card&card={name_encoded}&ed={ed}&num={num}",
    },
    "yugioh": {
        "site": "ligayugioh.com.br",
        "method": "playwright",
        "search_url": "https://www.ligayugioh.com.br/?view=cards/search&card={name}",
        "card_url_template": "https://www.ligayugioh.com.br/?view=cards/card&card={name_encoded}&ed={ed}&num={num}",
    },
    "fleshblood": {
        "site": "ligafab.com.br",
        "method": "playwright",
        "search_url": "https://www.ligafab.com.br/?view=cards/search&card={name}",
        "card_url_template": "https://www.ligafab.com.br/?view=cards/card&card={name_encoded}&ed={ed}&num={num}",
    },
    "riftbound": {
        "site": "ligariftbound.com.br",
        "method": "playwright",
        "search_url": "https://www.ligariftbound.com.br/?view=cards/search&card={name}",
        "card_url_template": "https://www.ligariftbound.com.br/?view=cards/card&card={name_encoded}&ed={ed}&num={num}",
    },
    "pokemon": {
        "site": "ligapokemon.com.br",
        "method": "firecrawl",
        "search_url": "https://www.ligapokemon.com.br/?view=cards%2Fsearch&card={name}",
        "card_url_template": "https://www.ligapokemon.com.br/?view=cards/card&card={name_encoded}&ed={ed}&num={num}",
    },
    "onepiece": {
        "site": "ligaonepiece.com.br",
        "method": "firecrawl",
        "search_url": "https://www.ligaonepiece.com.br/?view=cards%2Fsearch&card={name}",
        "card_url_template": "https://www.ligaonepiece.com.br/?view=cards/card&card={name_encoded}&ed={ed}&num={num}",
    },
}


# ── price extraction ─────────────────────────────────────────
def extract_prices_ligamagic(html: str) -> tuple[float | None, float | None, float | None]:
    """Extract min/avg/max from LigaMagic-style price divs."""
    # price-mkp blocks: each has 3 .price divs
    pattern = r'<div[^>]*class="[^"]*price-mkp[^"]*"[^>]*>(.*?)</div>\s*</div>\s*</div>'
    blocks = re.findall(pattern, html, re.DOTALL)
    if not blocks:
        return None, None, None

    # get first block prices
    price_pattern = r'<div[^>]*class="[^"]*price[^"]*"[^>]*>\s*R\$\s*([\d.,]+)'
    prices = re.findall(price_pattern, blocks[0])
    if len(prices) >= 3:
        def parse(p):
            return float(p.replace(".", "").replace(",", "."))

        return parse(prices[0]), parse(prices[1]), parse(prices[2])
    return None, None, None


def extract_prices_ligapokemon(markdown: str) -> tuple[float | None, float | None, float | None]:
    """Extract min/avg/max from Firecrawl markdown of LigaPokemon page."""
    # LigaPokemon format: Normal R$ X,XX / R$ Y,YY / R$ Z,ZZ
    pattern = r'R\$\s*([\d.,]+)\s*/\s*R\$\s*([\d.,]+)\s*/\s*R\$\s*([\d.,]+)'
    match = re.search(pattern, markdown)
    if match:
        def parse(p):
            return float(p.replace(".", "").replace(",", "."))

        return parse(match.group(1)), parse(match.group(2)), parse(match.group(3))
    return None, None, None


# ── playwright scraper ────────────────────────────────────────
async def scrape_playwright(game_id: str, cards: list[dict]) -> int:
    """Scrape prices using Playwright (MTG, YGO, F&B, Riftbound)."""
    site = GAME_SITES[game_id]
    inserted = 0

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.set_extra_http_headers(
            {
                "User-Agent": "TCGHub.ai/1.0 (+https://tcghub.ai) Price Research Bot",
                "Accept-Language": "pt-BR,pt;q=0.9",
            }
        )

        for card in cards:
            name = card["name"]
            # build search URL
            search_url = site["search_url"].format(name=quote(name))
            try:
                await page.goto(search_url, timeout=15000, wait_until="domcontentloaded")
                await asyncio.sleep(1.5)

                html = await page.content()
                price_min, price_avg, price_max = extract_prices_ligamagic(html)

                if price_min is not None:
                    await upsert_price(card["id"], price_min, price_avg, price_max, game_id)
                    inserted += 1
                    if inserted % 25 == 0:
                        print(f"  [{game_id}] {inserted}/{len(cards)} priced", flush=True)
                else:
                    # try with just first word of name (some cards have edition suffixes)
                    short_name = name.split(" (")[0].split(" - ")[0]
                    if short_name != name:
                        search_url2 = site["search_url"].format(name=quote(short_name))
                        await page.goto(search_url2, timeout=15000, wait_until="domcontentloaded")
                        await asyncio.sleep(1.5)
                        html2 = await page.content()
                        price_min, price_avg, price_max = extract_prices_ligamagic(html2)
                        if price_min is not None:
                            await upsert_price(card["id"], price_min, price_avg, price_max, game_id)
                            inserted += 1

            except Exception as e:
                print(f"  [{game_id}] error on {name}: {e}", flush=True)

            await asyncio.sleep(DELAY_PLAYWRIGHT)

        await browser.close()

    return inserted


# ── firecrawl scraper ─────────────────────────────────────────
async def scrape_firecrawl(game_id: str, cards: list[dict]) -> int:
    """Scrape prices using Firecrawl API (Pokémon, One Piece — Cloudflare bypass)."""
    site = GAME_SITES[game_id]
    inserted = 0

    async with httpx.AsyncClient(timeout=30) as client:
        for card in cards:
            name = card["name"]
            card_url = build_card_url(game_id, card)

            try:
                resp = await client.post(
                    FIRECRAWL_URL,
                    json={
                        "url": card_url,
                        "formats": ["markdown"],
                        "waitFor": 3000,
                    },
                    headers={
                        "Authorization": f"Bearer {FIRECRAWL_KEY}",
                        "Content-Type": "application/json",
                    },
                )
                if resp.status_code == 200:
                    data = resp.json()
                    md = data.get("data", {}).get("markdown", "")
                    price_min, price_avg, price_max = extract_prices_ligapokemon(md)

                    if price_min is not None:
                        await upsert_price(card["id"], price_min, price_avg, price_max, game_id)
                        inserted += 1
                        if inserted % 10 == 0:
                            print(f"  [{game_id}] {inserted}/{len(cards)} priced", flush=True)
                else:
                    print(f"  [{game_id}] firecrawl {resp.status_code} for {name}", flush=True)

            except Exception as e:
                print(f"  [{game_id}] error on {name}: {e}", flush=True)

            await asyncio.sleep(DELAY_FIRECRAWL)

    return inserted


def build_card_url(game_id: str, card: dict) -> str:
    """Build the individual card page URL."""
    site = GAME_SITES[game_id]
    name = card["name"]
    # extract edition info if present in name
    ed = card.get("set_code", card.get("edition", ""))
    num = card.get("number", card.get("collector_number", ""))

    name_encoded = quote(name)
    return site["card_url_template"].format(name_encoded=name_encoded, ed=ed, num=num)


# ── supabase write ────────────────────────────────────────────
async def upsert_price(card_id: str, price_min: float, price_avg: float, price_max: float, game_id: str):
    """Insert or update a card price record."""
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    now = datetime.now(timezone.utc).isoformat()
    source = f"liga_{game_id}"

    # check if price exists for this card + source today
    today = now[:10]
    existing = (
        supabase.table("card_prices")
        .select("id")
        .eq("card_id", card_id)
        .eq("source", source)
        .gte("updated_at", f"{today}T00:00:00")
        .limit(1)
        .execute()
    )

    if existing.data:
        # update existing
        supabase.table("card_prices").update(
            {
                "price_min": price_min,
                "price_avg": price_avg,
                "price_max": price_max,
                "price_currency": "BRL",
                "updated_at": now,
            }
        ).eq("id", existing.data[0]["id"]).execute()
    else:
        # insert new
        supabase.table("card_prices").insert(
            {
                "card_id": card_id,
                "price_min": price_min,
                "price_avg": price_avg,
                "price_max": price_max,
                "price_currency": "BRL",
                "source": source,
                "game_id": game_id,
                "updated_at": now,
                "created_at": now,
            }
        ).execute()


# ── card fetching ─────────────────────────────────────────────
async def fetch_cards(game_id: str, limit: int = 500) -> list[dict]:
    """Fetch cards from Supabase that need prices (game_id filter, no recent price)."""
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    resp = supabase.table("cards").select("id,name,set_code,number").eq("game_id", game_id).order("name").limit(limit).execute()
    return resp.data


# ── main ──────────────────────────────────────────────────────
async def main():
    games = sys.argv[1:] if len(sys.argv) > 1 else ["mtg", "yugioh", "fleshblood", "riftbound", "pokemon", "onepiece"]

    print(f"Unified Liga Scraper — {len(games)} games, up to {CARDS_PER_GAME} cards each", flush=True)
    print(f"Games: {', '.join(games)}", flush=True)
    print("=" * 60, flush=True)

    total = 0

    for game_id in games:
        if game_id not in GAME_SITES:
            print(f"  [{game_id}] unknown game, skipping", flush=True)
            continue

        method = GAME_SITES[game_id]["method"]
        print(f"\n[{game_id}] fetching up to {CARDS_PER_GAME} cards...", flush=True)

        cards = await fetch_cards(game_id, limit=CARDS_PER_GAME)
        print(f"[{game_id}] {len(cards)} cards fetched, method={method}", flush=True)

        if not cards:
            print(f"[{game_id}] no cards found, skipping", flush=True)
            continue

        if method == "playwright":
            inserted = await scrape_playwright(game_id, cards)
        elif method == "firecrawl":
            inserted = await scrape_firecrawl(game_id, cards)
        else:
            print(f"[{game_id}] unknown method {method}", flush=True)
            continue

        print(f"[{game_id}] done: {inserted}/{len(cards)} priced", flush=True)
        total += inserted

    print(f"\n{'=' * 60}", flush=True)
    print(f"Total: {total} prices inserted across {len(games)} games", flush=True)


if __name__ == "__main__":
    asyncio.run(main())
