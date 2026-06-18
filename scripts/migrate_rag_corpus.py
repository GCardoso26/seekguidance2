#!/usr/bin/env python3
"""
Migra corpus RAG (tenants, games, documents, document_versions, chunks)
do Supabase antigo para o projeto alinhado (auth + API).

Uso:
  set SOURCE_DATABASE_URL=postgresql+asyncpg://postgres.udtpsgdhknlanyndilyo:...@aws-1-sa-east-1.pooler.supabase.com:5432/postgres
  set TARGET_DATABASE_URL=postgresql+asyncpg://postgres.rjgzaakhzuzdzcooywva:...@aws-1-us-east-1.pooler.supabase.com:5432/postgres
  set DATABASE_SSL=require
  python scripts/migrate_rag_corpus.py --confirm

Não copia player_profiles, judge_profiles nem dados sociais.
"""

from __future__ import annotations

import argparse
import asyncio
import os
import sys
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO_ROOT / "services" / "ingestion"))

from tcg_judge_ingestion.storage.dsn import asyncpg_connect_kwargs  # noqa: E402

import asyncpg  # noqa: E402

TARGET_REF = "rjgzaakhzuzdzcooywva"
SOURCE_REF = "udtpsgdhknlanyndilyo"

TABLES_IN_ORDER = (
    "tenants",
    "games",
    "documents",
    "document_versions",
    "chunks",
)

TRUNCATE_ORDER = (
    "chunks",
    "document_versions",
    "documents",
    "games",
    "tenants",
)

CHUNK_BATCH = 200


def _load_dotenv() -> None:
    env_path = REPO_ROOT / "services" / "api" / ".env"
    if not env_path.exists():
        return
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value


def _assert_ref(url: str, ref: str, label: str) -> None:
    if ref not in url:
        raise SystemExit(f"{label} deve apontar para o projeto {ref} (URL não contém esse ref).")


async def _connect(dsn: str) -> asyncpg.Connection:
    url, kwargs = asyncpg_connect_kwargs(dsn)
    return await asyncpg.connect(url, **kwargs)


async def _table_columns(conn: asyncpg.Connection, table: str, *, for_insert: bool = False) -> list[str]:
    rows = await conn.fetch(
        """
        SELECT column_name, is_generated
        FROM information_schema.columns
        WHERE table_schema = 'tcg_judge' AND table_name = $1
        ORDER BY ordinal_position
        """,
        table,
    )
    cols = [r["column_name"] for r in rows]
    if for_insert:
        cols = [r["column_name"] for r in rows if r["is_generated"] != "ALWAYS"]
    return cols


async def _copy_columns(source: asyncpg.Connection, target: asyncpg.Connection, table: str) -> list[str]:
    source_cols = await _table_columns(source, table, for_insert=True)
    target_cols = set(await _table_columns(target, table, for_insert=True))
    cols = [c for c in source_cols if c in target_cols]
    skipped = [c for c in source_cols if c not in target_cols]
    if skipped:
        print(f"  {table}: colunas omitidas no destino → {', '.join(skipped)}")
    if not cols:
        raise SystemExit(f"Nenhuma coluna em comum para tcg_judge.{table}")
    return cols


async def _count(conn: asyncpg.Connection, table: str) -> int:
    return int(await conn.fetchval(f"SELECT COUNT(*) FROM tcg_judge.{table}"))


def _serialize_value(col: str, value: Any) -> Any:
    if value is None:
        return None
    if col == "embedding":
        return str(value)
    if hasattr(value, "hex"):
        return str(value)
    return value


async def _insert_row(
    target: asyncpg.Connection,
    table: str,
    cols: list[str],
    row: asyncpg.Record,
) -> None:
    set_parts: list[str] = []
    args: list[Any] = []
    for c in cols:
        if c == "embedding":
            set_parts.append(f"${len(args) + 1}::vector")
        else:
            set_parts.append(f"${len(args) + 1}")
        args.append(_serialize_value(c, row[c]))
    col_list = ", ".join(cols)
    sql = (
        f"INSERT INTO tcg_judge.{table} ({col_list}) "
        f"VALUES ({', '.join(set_parts)}) ON CONFLICT DO NOTHING"
    )
    await target.execute(sql, *args)


async def _copy_table(
    source: asyncpg.Connection,
    target: asyncpg.Connection,
    table: str,
) -> int:
    cols = await _copy_columns(source, target, table)
    col_list = ", ".join(cols)
    rows = await source.fetch(f"SELECT {col_list} FROM tcg_judge.{table}")

    if not rows:
        return 0

    if table == "chunks":
        inserted = 0
        for i in range(0, len(rows), CHUNK_BATCH):
            batch = rows[i : i + CHUNK_BATCH]
            async with target.transaction():
                for row in batch:
                    await _insert_row(target, table, cols, row)
                    inserted += 1
            print(f"  chunks: {min(i + CHUNK_BATCH, len(rows))}/{len(rows)}")
        return inserted

    async with target.transaction():
        for row in rows:
            await _insert_row(target, table, cols, row)
    return len(rows)


async def _clear_target(target: asyncpg.Connection) -> None:
    await target.execute("SET session_replication_role = replica")
    for table in TRUNCATE_ORDER:
        await target.execute(f"TRUNCATE TABLE tcg_judge.{table} CASCADE")
    await target.execute("SET session_replication_role = DEFAULT")


async def _verify(target: asyncpg.Connection) -> None:
    print("\n=== Verificação no destino ===")
    for table in TABLES_IN_ORDER:
        print(f"  {table}: {await _count(target, table)}")
    rag = await target.fetchrow(
        """
        SELECT
          COUNT(*) FILTER (WHERE chunk_count >= 1)::int AS games_with_chunks
        FROM (
          SELECT g.slug, COUNT(c.id)::int AS chunk_count
          FROM tcg_judge.games g
          LEFT JOIN tcg_judge.documents d ON d.game_id = g.id
          LEFT JOIN tcg_judge.chunks c ON c.document_id = d.id
          WHERE g.enabled
          GROUP BY g.slug
        ) s
        """
    )
    print(f"  jogos com corpus (enabled): {rag['games_with_chunks']}")


async def main() -> None:
    parser = argparse.ArgumentParser(description="Migra corpus RAG entre projetos Supabase")
    parser.add_argument(
        "--confirm",
        action="store_true",
        help="Executa de verdade (sem isso, só mostra o plano)",
    )
    args = parser.parse_args()

    _load_dotenv()
    source_dsn = os.environ.get("SOURCE_DATABASE_URL") or os.environ.get("DATABASE_URL", "")
    target_dsn = os.environ.get("TARGET_DATABASE_URL", "")

    if not source_dsn:
        raise SystemExit("Defina SOURCE_DATABASE_URL ou DATABASE_URL (projeto antigo).")
    if not target_dsn:
        raise SystemExit("Defina TARGET_DATABASE_URL (projeto rjgzaakhzuzdzcooywva).")

    _assert_ref(source_dsn, SOURCE_REF, "SOURCE_DATABASE_URL")
    _assert_ref(target_dsn, TARGET_REF, "TARGET_DATABASE_URL")

    print("Origem:", SOURCE_REF)
    print("Destino:", TARGET_REF)
    print("Tabelas:", ", ".join(TABLES_IN_ORDER))

    source = await _connect(source_dsn)
    target = await _connect(target_dsn)

    try:
        print("\n=== Contagens na origem ===")
        for table in TABLES_IN_ORDER:
            print(f"  {table}: {await _count(source, table)}")

        print("\n=== Contagens no destino (antes) ===")
        for table in TABLES_IN_ORDER:
            print(f"  {table}: {await _count(target, table)}")

        if not args.confirm:
            print(
                "\nDry-run. Para migrar, rode novamente com --confirm\n"
                "(apaga tenants/games/documents/chunks no DESTINO e recopia da origem)."
            )
            return

        print("\nLimpando corpus RAG no destino…")
        await _clear_target(target)

        print("Copiando dados…")
        await target.execute("SET session_replication_role = replica")
        try:
            for table in TABLES_IN_ORDER:
                n = await _copy_table(source, target, table)
                print(f"  {table}: {n} linhas")
        finally:
            await target.execute("SET session_replication_role = DEFAULT")

        await _verify(target)
        print(
            "\nPróximos passos:\n"
            "  1. Render: DATABASE_URL → projeto rjgzaakhzuzdzcooywva (pooler us-east-1)\n"
            "  2. SQL Editor: criar índice HNSW se ainda não existir "
            "(supabase/migrations/20260520000001_hnsw_index_chunks.sql)\n"
            "  3. curl https://seekguidance.onrender.com/runtime/judge/games → rag_ready: true\n"
        )
    finally:
        await source.close()
        await target.close()


if __name__ == "__main__":
    asyncio.run(main())
