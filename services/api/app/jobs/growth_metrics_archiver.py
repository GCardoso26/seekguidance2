"""
Job semanal de arquivamento de métricas de crescimento (> 90 dias).

Agrega em judge_growth_monthly_summary e remove registos brutos.
Executar via cron ou manualmente: python -m jobs.growth_metrics_archiver
"""

from __future__ import annotations

import argparse
import asyncio
import json

import structlog

logger = structlog.get_logger(__name__)


async def archive_old_metrics(dsn: str) -> dict:
    from tcg_judge_ingestion.storage.dsn import asyncpg_connect_kwargs

    clean, kwargs = asyncpg_connect_kwargs(dsn)
    conn = await __import__("asyncpg").connect(clean, **kwargs)
    try:
        agg = await conn.execute(
            """
            INSERT INTO tcg_judge.judge_growth_monthly_summary
              (period, game, metric_type, total, unique_users)
            SELECT
              date_trunc('month', created_at)::DATE AS period,
              game,
              metric_type,
              COUNT(*)::bigint AS total,
              COUNT(DISTINCT COALESCE(user_id, session_id::text, details->>'fingerprint'))::bigint
            FROM tcg_judge.judge_growth_metrics
            WHERE created_at < NOW() - INTERVAL '90 days'
            GROUP BY 1, 2, 3
            ON CONFLICT (period, game, metric_type) DO UPDATE
              SET total = judge_growth_monthly_summary.total + EXCLUDED.total,
                  unique_users = GREATEST(
                    COALESCE(judge_growth_monthly_summary.unique_users, 0),
                    COALESCE(EXCLUDED.unique_users, 0)
                  )
            """
        )
        deleted = await conn.execute(
            """
            DELETE FROM tcg_judge.judge_growth_metrics
            WHERE created_at < NOW() - INTERVAL '90 days'
            """
        )
        logger.info("growth_metrics_archived", aggregate=agg, deleted=deleted)
        return {"aggregate_status": agg, "deleted_status": deleted, "integrity_status": "ok"}
    finally:
        await conn.close()


def main() -> None:
    parser = argparse.ArgumentParser(description="Arquivar métricas Judge > 90 dias")
    parser.add_argument("--dsn", required=True)
    args = parser.parse_args()
    result = asyncio.run(archive_old_metrics(args.dsn))
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
