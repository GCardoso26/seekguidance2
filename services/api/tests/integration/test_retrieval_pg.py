"""Integração: Postgres pgvector + schema + insert mínimo (Docker + RUN_INTEGRATION=1)."""

from __future__ import annotations

import os
from pathlib import Path
from uuid import uuid4

import pytest

pytestmark = pytest.mark.integration


@pytest.fixture(scope="module")
def pg_dsn() -> str:
    if os.getenv("RUN_INTEGRATION") != "1":
        pytest.skip("Defina RUN_INTEGRATION=1 e tenha Docker para testcontainers.")
    from testcontainers.postgres import PostgresContainer

    with PostgresContainer("pgvector/pgvector:pg16") as pg:
        raw = pg.get_connection_url()
        # psycopg v3 espera postgresql:// (sem prefixo SQLAlchemy)
        yield raw.replace("postgresql+psycopg2://", "postgresql://").replace("postgresql+asyncpg://", "postgresql://")


def _run_sql_file(conn, path: Path) -> None:
    sql = path.read_text(encoding="utf-8")
    conn.execute(sql)


def test_minimal_chunks_hybrid_smoke(pg_dsn: str) -> None:
    """Smoke: schema carrega, chunks com embedding, FTS encontra 'priority'."""
    import psycopg

    # .../services/api/tests/integration/file.py -> repo tcg-judge = parents[4]
    repo_root = Path(__file__).resolve().parents[4]
    init_sql = repo_root / "infra" / "db" / "init.sql"
    rag_sql = repo_root / "infra" / "db" / "02_rag_mtg.sql"

    with psycopg.connect(pg_dsn, autocommit=True) as conn:
        _run_sql_file(conn, init_sql)
        if rag_sql.is_file():
            _run_sql_file(conn, rag_sql)

    tenant_id = uuid4()
    game_id = uuid4()
    doc_id = uuid4()
    c_priority = uuid4()
    c_parent = uuid4()
    emb = "[" + ",".join(["0.02"] * 1536) + "]"
    h64 = "a" * 64
    h64b = "b" * 64

    with psycopg.connect(pg_dsn, autocommit=True) as conn:
        conn.execute(
            "INSERT INTO tcg_judge.tenants (id, slug, name) VALUES (%s,%s,%s)",
            (tenant_id, "t-int", "Tenant Int"),
        )
        conn.execute(
            """
            INSERT INTO tcg_judge.games (id, tenant_id, slug, display_name, publisher, enabled)
            VALUES (%s,%s,%s,%s,%s,true)
            """,
            (game_id, tenant_id, "mtg", "Magic", "Wizards of the Coast"),
        )
        conn.execute(
            """
            INSERT INTO tcg_judge.documents (
                id, game_id, doc_type, title, source_url, publisher, content_hash, raw_mime, metadata
            ) VALUES (%s,%s,'cr','CR','https://example.invalid/cr','Wizards','hash1','application/pdf','{}')
            """,
            (doc_id, game_id),
        )
        conn.execute(
            """
            INSERT INTO tcg_judge.chunks (
                id, document_id, chunk_index, section_path, text, token_count,
                embedding, metadata, rule_path, parent_rule_path, hierarchy_level,
                semantic_path, content_sha256, parent_chunk_id, version_label
            ) VALUES (
                %s,%s,0,'502','502. Priority rules',50,%s::vector,'{}','502',NULL,0,'502',%s,NULL,'2024'
            )
            """,
            (c_parent, doc_id, emb, h64),
        )
        conn.execute(
            """
            INSERT INTO tcg_judge.chunks (
                id, document_id, chunk_index, section_path, text, token_count,
                embedding, metadata, rule_path, parent_rule_path, hierarchy_level,
                semantic_path, content_sha256, parent_chunk_id, version_label
            ) VALUES (
                %s,%s,1,'502.1','502.1. Priority passes in multiplayer.',50,%s::vector,'{}',
                '502.1','502',1,'502 > 502.1',%s,%s,'2024'
            )
            """,
            (c_priority, doc_id, emb, h64b, c_parent),
        )

        n = conn.execute(
            """
            SELECT count(*) FROM tcg_judge.chunks c
            JOIN tcg_judge.documents d ON d.id = c.document_id
            WHERE d.game_id = %s AND c.embedding IS NOT NULL
            """,
            (game_id,),
        ).fetchone()[0]
        assert n == 2

        rows = conn.execute(
            """
            SELECT c.id FROM tcg_judge.chunks c
            JOIN tcg_judge.documents d ON d.id = c.document_id
            WHERE d.game_id = %s
              AND to_tsvector('english', c.text) @@ plainto_tsquery('english', 'priority')
            """,
            (game_id,),
        ).fetchall()
        assert len(rows) >= 1
