#!/usr/bin/env python3
"""Job offline: inferir `rule_graph_edges` a partir de chunks (não usar no request path)."""

from __future__ import annotations

import argparse
import asyncio
import os
import sys
from pathlib import Path

_REPO = Path(__file__).resolve().parents[1]
_API = _REPO / "services" / "api"
sys.path.insert(0, str(_API))


async def _async_main() -> None:
    from sqlalchemy import select, text as sql_text

    from app.core.config import get_settings
    from app.graph.relationship_extraction.batch_offline import build_edges_from_document_corpus
    from app.graph.relationship_extraction.graph_store import upsert_rule_graph_edges
    from app.graph.relationship_extraction.llm_graph_builder import llm_propose_edges_from_snippets
    from app.graph.relationship_extraction.schema import InferredRuleEdge
    from app.infrastructure.db.models import Game
    from app.infrastructure.db.session import get_session_factory

    p = argparse.ArgumentParser(description="Inferir arestas rule_graph_edges (offline).")
    p.add_argument("--game", default="mtg")
    p.add_argument("--limit", type=int, default=600)
    p.add_argument("--dry-run", action="store_true")
    p.add_argument("--use-llm", action="store_true", help="Chama LLM em lote (OPENAI_API_KEY).")
    p.add_argument("--min-score", type=float, default=0.42)
    args = p.parse_args()

    settings = get_settings()
    sf = get_session_factory()
    async with sf() as session:
        game = (await session.execute(select(Game).where(Game.slug == args.game))).scalar_one_or_none()
        if game is None:
            raise SystemExit(f"Jogo não encontrado: {args.game}")

        q = sql_text(
            """
            SELECT c.document_id, c.rule_path, c.text
            FROM tcg_judge.chunks c
            JOIN tcg_judge.documents d ON d.id = c.document_id
            WHERE d.game_id = :gid AND c.rule_path IS NOT NULL
            ORDER BY c.document_id, c.chunk_index
            LIMIT :lim
            """
        )
        rows_raw = (await session.execute(q, {"gid": game.id, "lim": args.limit})).all()
        rows = [(r[0], r[1], r[2]) for r in rows_raw]

        inferred = build_edges_from_document_corpus(rows, min_relationship_score=args.min_score)

        if args.use_llm and settings.openai_api_key:
            snippets = [
                {"rule_path": rp, "text": (tx or "")[:1200]} for (_d, rp, tx) in rows[:40] if rp
            ]
            llm_edges = await llm_propose_edges_from_snippets(snippets, settings=settings)
            for e in llm_edges:
                inferred.append(
                    InferredRuleEdge(
                        source_rule_id=str(e["source_rule_id"]),
                        target_rule_id=str(e["target_rule_id"]),
                        relationship_type=str(e["relationship_type"]),
                        confidence=float(e.get("confidence", 0)),
                        evidence=list(e.get("evidence") or ["llm_inference"]),
                        relationship_score=float(e.get("relationship_score", 0)),
                        metadata={"source": "llm_offline"},
                    )
                )

        print(f"candidate_edges={len(inferred)} game={args.game} dry_run={args.dry_run}")
        if args.dry_run:
            for e in inferred[:12]:
                print(e.source_rule_id, "->", e.target_rule_id, e.relationship_type, round(e.relationship_score, 3))
            return

        n = await upsert_rule_graph_edges(session, game.id, inferred)
        await session.commit()
        print(f"upserted_edges={n}")


def main() -> None:
    if not os.environ.get("DATABASE_URL"):
        raise SystemExit("DATABASE_URL obrigatório (postgresql+asyncpg://...)")
    asyncio.run(_async_main())


if __name__ == "__main__":
    main()
