"""Expansão por grafo: vizinhos curados + arestas persistidas em `rule_graph_edges`."""

from __future__ import annotations

from collections.abc import Sequence
from uuid import UUID

from sqlalchemy import bindparam, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.graph.adaptive_expansion import dedupe_cap_heads
from app.graph.graph_builder import seed_rule_heads_from_hits
from app.graph.semantic_links import rule_numeric_head
from app.retrieval.types import ChunkHit


def _rule_path_or_clauses(heads: list[str]) -> tuple[str, dict[str, object]]:
    if not heads:
        return "", {}
    parts: list[str] = []
    params: dict[str, object] = {}
    for i, h in enumerate(heads):
        if not h.isdigit():
            continue
        p_eq = f"rp{i}"
        p_like = f"rpl{i}"
        params[p_eq] = h
        params[p_like] = f"{h}.%"
        parts.append(f"(c.rule_path = :{p_eq} OR c.rule_path LIKE :{p_like})")
    if not parts:
        return "", {}
    return "(" + " OR ".join(parts) + ")", params


async def fetch_graph_neighbor_ids(
    session: AsyncSession,
    game_id: UUID,
    heads: list[str],
    *,
    limit: int,
    exclude: set[UUID],
) -> list[UUID]:
    if not heads:
        return []
    clause, extra = _rule_path_or_clauses(heads)
    if not clause:
        return []
    q = text(
        f"""
        SELECT c.id
        FROM tcg_judge.chunks c
        JOIN tcg_judge.documents d ON d.id = c.document_id
        WHERE d.game_id = :gid
          AND c.rule_path IS NOT NULL
          AND {clause}
        ORDER BY c.hierarchy_level ASC, c.chunk_index ASC
        LIMIT :lim
        """
    )
    params: dict[str, object] = {"gid": game_id, "lim": limit, **extra}
    rows = (await session.execute(q, params)).all()
    out: list[UUID] = []
    for row in rows:
        cid: UUID = row[0]
        if cid not in exclude:
            out.append(cid)
    return out


async def fetch_graph_edges_extra_heads(
    session: AsyncSession,
    game_id: UUID,
    seed_heads: list[str],
    *,
    limit: int,
    min_relationship_score: float | None = None,
) -> list[str]:
    if not seed_heads:
        return []
    extra_sql = ""
    params: dict[str, object] = {"gid": game_id, "seeds": list(dict.fromkeys(seed_heads)), "lim": limit}
    if min_relationship_score is not None:
        extra_sql = " AND COALESCE(NULLIF(e.metadata->>'relationship_score','')::float, 0.52) >= :min_rs "
        params["min_rs"] = float(min_relationship_score)
    q = text(
        f"""
        SELECT sub.dst_rule
        FROM (
            SELECT e.dst_rule,
                   MAX(COALESCE(q.reinforcement_score, 0.5)) AS rs
            FROM tcg_judge.rule_graph_edges e
            LEFT JOIN tcg_judge.rule_graph_edge_quality q
              ON q.game_id = e.game_id
             AND q.src_rule = e.src_rule
             AND q.dst_rule = e.dst_rule
             AND q.relation = e.relation
            WHERE e.game_id = :gid
              AND e.src_rule = ANY(:seeds)
              {extra_sql}
            GROUP BY e.dst_rule
        ) sub
        ORDER BY sub.rs DESC
        LIMIT :lim
        """
    ).bindparams(bindparam("seeds", expanding=True))
    rows = (await session.execute(q, params)).all()
    return [str(r[0]) for r in rows if r[0]]


async def fetch_graph_edge_trace_strings(
    session: AsyncSession,
    game_id: UUID,
    seed_heads: list[str],
    *,
    limit: int,
    min_relationship_score: float | None = None,
) -> list[str]:
    """Rótulos estáveis para feedback: `src->dst:relation`."""
    if not seed_heads:
        return []
    extra_sql = ""
    params: dict[str, object] = {"gid": game_id, "seeds": list(dict.fromkeys(seed_heads)), "lim": limit}
    if min_relationship_score is not None:
        extra_sql = " AND COALESCE(NULLIF(e.metadata->>'relationship_score','')::float, 0.52) >= :min_rs "
        params["min_rs"] = float(min_relationship_score)
    q = text(
        f"""
        SELECT e.src_rule, e.dst_rule, e.relation,
               COALESCE(q.reinforcement_score, 0.5) AS rs
        FROM tcg_judge.rule_graph_edges e
        LEFT JOIN tcg_judge.rule_graph_edge_quality q
          ON q.game_id = e.game_id
         AND q.src_rule = e.src_rule
         AND q.dst_rule = e.dst_rule
         AND q.relation = e.relation
        WHERE e.game_id = :gid
          AND e.src_rule = ANY(:seeds)
          {extra_sql}
        ORDER BY rs DESC
        LIMIT :lim
        """
    ).bindparams(bindparam("seeds", expanding=True))
    rows = (await session.execute(q, params)).all()
    out: list[str] = []
    for r in rows:
        out.append(f"{r[0]}->{r[1]}:{r[2]}")
    return out


async def expand_hits_with_graph(
    session: AsyncSession,
    game_id: UUID,
    hits: list[ChunkHit],
    *,
    graph_extra_limit: int,
    exclude: set[UUID],
    extra_rule_heads: Sequence[str] | None = None,
    edge_min_relationship_score: float | None = None,
    max_seed_heads: int = 14,
) -> tuple[list[UUID], list[str]]:
    """Devolve (ids de chunks, traço de arestas usadas na expansão)."""
    heads = seed_rule_heads_from_hits(hits)
    seed_src: list[str] = []
    for h in hits[:10]:
        rh = rule_numeric_head(h.rule_path)
        if rh and rh not in seed_src:
            seed_src.append(rh)
    edge_min = edge_min_relationship_score
    db_heads = await fetch_graph_edges_extra_heads(
        session,
        game_id,
        seed_src,
        limit=16,
        min_relationship_score=edge_min,
    )
    edge_trace = await fetch_graph_edge_trace_strings(
        session,
        game_id,
        seed_src,
        limit=24,
        min_relationship_score=edge_min,
    )
    merged = list(
        dict.fromkeys(
            [
                *heads,
                *seed_src,
                *[h for h in db_heads if str(h).isdigit()],
                *[str(x).strip() for x in (extra_rule_heads or ()) if str(x).strip().isdigit()],
            ]
        )
    )
    merged = dedupe_cap_heads(merged, max_heads=max(4, max_seed_heads))
    ids = await fetch_graph_neighbor_ids(session, game_id, merged, limit=graph_extra_limit, exclude=exclude)
    return ids, edge_trace
