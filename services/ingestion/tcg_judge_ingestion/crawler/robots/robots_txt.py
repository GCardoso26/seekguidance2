"""Leitura best-effort de robots.txt (respeito a crawl)."""

from __future__ import annotations

import httpx


async def fetch_robots_txt(origin: str, *, user_agent: str, timeout: float = 15.0) -> str | None:
    base = origin.rstrip("/")
    url = f"{base}/robots.txt"
    try:
        async with httpx.AsyncClient(headers={"User-Agent": user_agent}, timeout=timeout) as client:
            r = await client.get(url)
            if r.status_code == 200:
                return r.text
    except Exception:
        return None
    return None
