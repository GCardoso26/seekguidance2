"""Relatório semanal de métricas para admins (Resend)."""

from __future__ import annotations

import asyncio
import logging
import os
from typing import Any

import httpx

from app.analytics.retention import retention_metrics
from app.infrastructure.db.session import get_session_factory

logger = logging.getLogger(__name__)

RESEND_API_URL = "https://api.resend.com/emails"


def render_weekly_report_html(
    *,
    current: dict[str, Any],
    previous: dict[str, Any] | None = None,
) -> str:
    funnel = current.get("funnel") or {}
    rates = current.get("funnel_rates") or {}
    prev_funnel = (previous or {}).get("funnel") or {}
    prev_purchases = int(prev_funnel.get("purchases") or 0)
    purchases = int(funnel.get("purchases") or 0)
    purchase_delta = purchases - prev_purchases if previous else None

    xp_rows = current.get("xp_distribution") or []
    xp_html = "".join(
        f"<li>{row['current_level'].capitalize()}: {row['count']}</li>" for row in xp_rows
    )

    delta_line = ""
    if purchase_delta is not None:
        sign = "+" if purchase_delta >= 0 else ""
        delta_line = f"<p>Variação de compras vs semana anterior: {sign}{purchase_delta}</p>"

    return f"""
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
      <h1>Relatório Semanal — Judge-TCG</h1>
      <p>Período: últimos {current.get('period_days', 7)} dias</p>

      <h2>Funil de conversão</h2>
      <ul>
        <li>Page views: {funnel.get('page_views', 0)}</li>
        <li>Buscas: {funnel.get('searches', 0)} ({rates.get('search_rate', 0)}%)</li>
        <li>Detalhe da carta: {funnel.get('card_views', 0)}</li>
        <li>Add to cart: {funnel.get('add_to_carts', 0)}</li>
        <li>Compras: {purchases} ({rates.get('purchase_rate', 0)}% do carrinho)</li>
      </ul>
      {delta_line}

      <h2>Engajamento</h2>
      <ul>
        <li>WAU: {current.get('wau', 0)}</li>
        <li>MAU: {current.get('mau', 0)}</li>
        <li>Tempo médio de sessão: {current.get('avg_session_seconds', 0)}s</li>
      </ul>

      <h2>Liga Pass</h2>
      <ul>{xp_html or '<li>Sem dados</li>'}</ul>

      <h2>GMV</h2>
      <p>R$ {float(current.get('gmv_brl') or 0):.2f}</p>

      <p><a href="https://judgetcg.com.br/admin/retention">Ver dashboard completo</a></p>
    </div>
    """


async def send_weekly_report_email(*, to_email: str | None = None) -> dict[str, Any]:
    to = (to_email or os.getenv("WEEKLY_REPORT_EMAIL") or "admin@judgetcg.com.br").strip()
    api_key = os.getenv("RESEND_API_KEY", "").strip()
    from_email = os.getenv("RESEND_FROM_EMAIL", "Judge TCG <alertas@judgetcg.com.br>").strip()

    async with get_session_factory()() as session:
        current = await retention_metrics(session, days=7)
        from datetime import UTC, datetime, timedelta
        from sqlalchemy import text

        prev_row = (
            await session.execute(
                text(
                    """
                    SELECT COUNT(*)::int AS c
                    FROM tcg_judge.analytics_events
                    WHERE event = 'purchase'
                      AND timestamp >= :start
                      AND timestamp < :end
                    """
                ),
                {
                    "start": datetime.now(UTC) - timedelta(days=14),
                    "end": datetime.now(UTC) - timedelta(days=7),
                },
            )
        ).mappings().first()
        previous = {
            "funnel": {"purchases": int(prev_row["c"] or 0) if prev_row else 0},
        }

    if not api_key:
        logger.info("weekly_report_stub", to=to, purchases=current["funnel"]["purchases"])
        return {"sent": False, "reason": "RESEND_API_KEY not set", "report": current}

    payload = {
        "from": from_email,
        "to": [to],
        "subject": "Weekly Report — Judge-TCG",
        "html": render_weekly_report_html(current=current, previous=previous),
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            res = await client.post(
                RESEND_API_URL,
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json=payload,
            )
        if res.status_code >= 400:
            logger.warning("weekly_report_failed", status=res.status_code, body=res.text[:300])
            return {"sent": False, "reason": res.text[:300]}
        logger.info("weekly_report_sent", to=to)
        return {"sent": True, "to": to}
    except Exception as exc:
        logger.exception("weekly_report_error")
        return {"sent": False, "reason": str(exc)}


async def run_weekly_report_job() -> dict[str, Any]:
    return await send_weekly_report_email()


def main() -> None:
    result = asyncio.run(run_weekly_report_job())
    print(result)


if __name__ == "__main__":
    main()
