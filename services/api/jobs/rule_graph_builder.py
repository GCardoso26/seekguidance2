#!/usr/bin/env python3
"""
Pós-ingestão: extrai referências entre regras e popula rule_graph_edges.

Uso:
  python -m jobs.rule_graph_builder --game mtg --dsn "$DATABASE_URL"
"""

from __future__ import annotations

import argparse
import asyncio
import json
import re
from typing import Any

import asyncpg

REFERENCE_PATTERNS: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"\bsee rule\s+(\d{3,4}(?:\.\d+[a-z]?)?)", re.I), "references"),
    (re.compile(r"\brefer to rule\s+(\d{3,4}(?:\.\d+[a-z]?)?)", re.I), "references"),
    (re.compile(r"\bexception to rule\s+(\d{3,4}(?:\.\d+[a-z]?)?)", re.I), "exception_to"),
    (re.compile(r"\bsupersedes rule\s+(\d{3,4}(?:\.\d+[a-z]?)?)", re.I), "supersedes"),
    (re.compile(r"\bexample of rule\s+(\d{3,4}(?:\.\d+[a-z]?)?)", re.I), "example_of"),
]

ERRATA_MARKERS = re.compile(r"\b(errata|updated|replaces previous)\b", re.I)


async def _connect(dsn: str) -> asyncpg.Connection:
    from tcg_judge_ingestion.storage.dsn import asyncpg_connect_kwargs

    clean, kwargs = asyncpg_connect_kwargs(dsn)
    return await asyncpg.connect(clean, **kwargs)


async def build_for_game(
    conn: asyncpg.Connection,
    game_slug: str,
    *,
    min_confidence: float = 0.45,
) -> dict[str, Any]:
    game = await conn.fetchrow(
        "SELECT id FROM tcg_judge.games WHERE slug = $1",
        game_slug,
    )
    if not game:
        return {"game_slug": game_slug, "edges_written": 0, "integrity_status": "ok"}

    gid = game["id"]
    rows = await conn.fetch(
        """
        SELECT rule_path, rule_atom, text
        FROM tcg_judge.chunks c
        JOIN tcg_judge.documents d ON d.id = c.document_id
        WHERE d.game_id = $1 AND c.rule_path IS NOT NULL
        """,
        gid,
    )

    edges: dict[tuple[str, str, str], float] = {}
    for row in rows:
        src = (row["rule_atom"] or row["rule_path"] or "").strip()
        if not src:
            continue
        text_block = row["text"] or ""
        for pattern, relation in REFERENCE_PATTERNS:
            for m in pattern.finditer(text_block):
                dst = m.group(1).strip()
                conf = 0.72
                edges[(src, dst, relation)] = max(edges.get((src, dst, relation), 0), conf)
        if ERRATA_MARKERS.search(text_block) and "." in src:
            parent = re.sub(r"[a-z]$", "", src)
            if parent != src:
                edges[(src, parent, "supersedes")] = max(
                    edges.get((src, parent, "supersedes"), 0), 0.85
                )

    written = 0
    for (src, dst, relation), confidence in edges.items():
        if confidence < min_confidence:
            continue
        meta = json.dumps({"confidence": confidence, "source": "rule_graph_builder"})
        await conn.execute(
            """
            INSERT INTO tcg_judge.rule_graph_edges (game_id, src_rule, dst_rule, relation, metadata)
            VALUES ($1, $2, $3, $4, $5::jsonb)
            ON CONFLICT (game_id, src_rule, dst_rule, relation)
            DO UPDATE SET metadata = EXCLUDED.metadata
            """,
            gid,
            src,
            dst,
            relation,
            meta,
        )
        written += 1

    return {
        "game_slug": game_slug,
        "edges_written": written,
        "chunks_scanned": len(rows),
        "integrity_status": "ok",
    }


async def main_async(game_slug: str, dsn: str, min_confidence: float) -> int:
    conn = await _connect(dsn)
    try:
        result = await build_for_game(conn, game_slug, min_confidence=min_confidence)
        print(json.dumps(result, indent=2))
    finally:
        await conn.close()
    return 0


def main() -> None:
    parser = argparse.ArgumentParser(description="Build rule graph edges from chunks")
    parser.add_argument("--game", required=True)
    parser.add_argument("--dsn", required=True)
    parser.add_argument("--min-confidence", type=float, default=0.45)
    args = parser.parse_args()
    raise SystemExit(asyncio.run(main_async(args.game, args.dsn, args.min_confidence)))


if __name__ == "__main__":
    main()
