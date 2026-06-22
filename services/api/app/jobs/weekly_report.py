"""Relatório semanal de métricas para admins (Resend + fallback HTML)."""

from __future__ import annotations

import asyncio
import logging
import os
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any

import httpx
from sqlalchemy import text

from app.analytics.retention import retention_metrics
from app.infrastructure.db.session import get_session_factory

logger = logging.getLogger(__name__)

RESEND_API_URL = "https://api.resend.com/emails"


def calc_change(current_val: float | int, previous_val: float | int) -> float:
    if not previous_val:
        return 0.0
    return round(((float(current_val) - float(previous_val)) / float(previous_val)) * 100, 1)


def generate_highlights(metrics: dict[str, Any], changes: dict[str, Any]) -> list[str]:
    highlights: list[str] = []
    funnel = metrics.get("funnel") or {}
    rates = metrics.get("funnel_rates") or {}

    purchases = int(funnel.get("purchases") or 0)
    if purchases > 0:
        highlights.append(f"{purchases} compras realizadas esta semana")

    dau_change = float(changes.get("wau") or 0)
    if dau_change > 20:
        highlights.append(f"WAU cresceu {dau_change}% em relação à semana anterior")

    if float(rates.get("overall_conversion") or 0) > 5:
        highlights.append(f"Taxa de conversão geral de {rates['overall_conversion']}% — acima da meta de 5%")

    xp_dist = metrics.get("xp_distribution") or []
    judge_count = next((int(x["count"]) for x in xp_dist if x.get("current_level") == "judge"), 0)
    if judge_count > 0:
        highlights.append(f"{judge_count} usuários no nível Juiz")

    return highlights or ["Sem destaques significativos esta semana"]


def generate_recommendations(metrics: dict[str, Any]) -> list[str]:
    recs: list[str] = []
    rates = metrics.get("funnel_rates") or {}
    gmv_brl = float(metrics.get("gmv_brl") or 0)

    if float(rates.get("cart_rate") or 0) < 30:
        recs.append("Taxa de carrinho baixa. Considerar frete grátis e lembretes de carrinho abandonado.")

    if float(rates.get("detail_rate") or 0) < 50:
        recs.append("Poucos usuários clicam em cartas. Melhorar imagens e preços em destaque.")

    if gmv_brl == 0:
        recs.append("GMV zerado. Prioridade: ativar vendedores e campanha de marketing.")

    elif gmv_brl < 1000:
        recs.append("GMV baixo. Sugestão: incentivar listagens e promoção de lançamento.")

    return recs or ["Métricas estáveis. Manter monitoramento."]


async def _wau_between(session, *, start: datetime, end: datetime) -> int:
    row = (
        await session.execute(
            text(
                """
                SELECT COUNT(DISTINCT COALESCE(user_id, anonymous_id, session_id))::int AS c
                FROM tcg_judge.analytics_events
                WHERE timestamp >= :start AND timestamp < :end
                """
            ),
            {"start": start, "end": end},
        )
    ).mappings().first()
    return int(row["c"] or 0) if row else 0


async def _gmv_between(session, *, start: datetime, end: datetime) -> int:
    row = (
        await session.execute(
            text(
                """
                SELECT COALESCE(SUM(total_cents), 0)::bigint AS gmv_cents
                FROM tcg_judge.shop_orders
                WHERE status = 'paid' AND created_at >= :start AND created_at < :end
                """
            ),
            {"start": start, "end": end},
        )
    ).mappings().first()
    return int(row["gmv_cents"] or 0) if row else 0


async def _purchases_between(session, *, start: datetime, end: datetime) -> int:
    row = (
        await session.execute(
            text(
                """
                SELECT COUNT(*)::int AS c
                FROM tcg_judge.analytics_events
                WHERE event = 'purchase' AND timestamp >= :start AND timestamp < :end
                """
            ),
            {"start": start, "end": end},
        )
    ).mappings().first()
    return int(row["c"] or 0) if row else 0


async def generate_weekly_report() -> dict[str, Any]:
    now = datetime.now(UTC)
    week_start = now - timedelta(days=7)
    prev_start = now - timedelta(days=14)
    prev_end = week_start

    async with get_session_factory()() as session:
        current = await retention_metrics(session, days=7)
        prev_wau = await _wau_between(session, start=prev_start, end=prev_end)
        prev_gmv_cents = await _gmv_between(session, start=prev_start, end=prev_end)
        prev_purchases = await _purchases_between(session, start=prev_start, end=prev_end)

    changes = {
        "wau": calc_change(current.get("wau", 0), prev_wau),
        "purchases": calc_change(
            (current.get("funnel") or {}).get("purchases", 0),
            prev_purchases,
        ),
        "gmv": calc_change(current.get("gmv_cents", 0), prev_gmv_cents),
    }

    return {
        "period": {
            "start": week_start.strftime("%d/%m/%Y"),
            "end": now.strftime("%d/%m/%Y"),
        },
        "metrics": current,
        "changes": changes,
        "highlights": generate_highlights(current, changes),
        "recommendations": generate_recommendations(current),
    }


def render_weekly_email_html(report: dict[str, Any]) -> str:
    metrics = report["metrics"]
    changes = report["changes"]
    funnel = metrics.get("funnel") or {}
    rates = metrics.get("funnel_rates") or {}
    gmv_brl = float(metrics.get("gmv_brl") or 0)

    def trend(key: str) -> str:
        val = float(changes.get(key) or 0)
        css = "positive" if val >= 0 else "negative"
        arrow = "▲" if val >= 0 else "▼"
        return f'<div class="{css}">{arrow} {abs(val)}%</div>'

    highlights_html = "".join(f'<div class="highlight">{h}</div>' for h in report.get("highlights", []))
    recs_html = "".join(f'<div class="recommendation">{r}</div>' for r in report.get("recommendations", []))
    xp_rows = "".join(
        f"<tr><td>{x['current_level'].capitalize()}</td><td>{x['count']}</td></tr>"
        for x in metrics.get("xp_distribution", [])
    )

    return f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 16px; }}
    h1 {{ color: #1a1a1a; border-bottom: 2px solid #C41E3A; padding-bottom: 10px; font-size: 1.4rem; }}
    h2 {{ color: #555; font-size: 1.1rem; margin-top: 24px; }}
    .metric {{ background: #f5f5f5; padding: 12px; border-radius: 8px; margin: 10px 0; }}
    .metric-value {{ font-size: 1.6rem; font-weight: bold; color: #C41E3A; }}
    .metric-label {{ color: #666; font-size: 0.9em; }}
    .positive {{ color: #22C55E; }}
    .negative {{ color: #EF4444; }}
    .highlight {{ background: #fef3c7; padding: 10px; border-left: 4px solid #F59E0B; margin: 8px 0; }}
    .recommendation {{ background: #dbeafe; padding: 10px; border-left: 4px solid #3B82F6; margin: 8px 0; }}
    table {{ width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 0.95rem; }}
    th, td {{ padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }}
    th {{ background: #f5f5f5; }}
    .footer {{ margin-top: 32px; padding-top: 16px; border-top: 1px solid #ddd; color: #999; font-size: 0.85em; }}
  </style>
</head>
<body>
  <h1>Judge-TCG Weekly Report</h1>
  <p><strong>Período:</strong> {report['period']['start']} a {report['period']['end']}</p>

  <h2>Destaques da Semana</h2>
  {highlights_html or '<p>Sem destaques.</p>'}

  <h2>Métricas Principais</h2>
  <div class="metric">
    <div class="metric-value">{metrics.get('wau', 0):,}</div>
    <div class="metric-label">WAU (usuários ativos na semana)</div>
    {trend('wau')}
  </div>
  <div class="metric">
    <div class="metric-value">R$ {gmv_brl:,.2f}</div>
    <div class="metric-label">GMV</div>
    {trend('gmv')}
  </div>

  <h2>Funil de Conversão</h2>
  <table>
    <tr><th>Etapa</th><th>Volume</th><th>Taxa</th></tr>
    <tr><td>Page Views</td><td>{funnel.get('page_views', 0):,}</td><td>100%</td></tr>
    <tr><td>Buscas</td><td>{funnel.get('searches', 0):,}</td><td>{rates.get('search_rate', 0)}%</td></tr>
    <tr><td>Detalhe</td><td>{funnel.get('card_views', 0):,}</td><td>{rates.get('detail_rate', 0)}%</td></tr>
    <tr><td>Add to Cart</td><td>{funnel.get('add_to_carts', 0):,}</td><td>{rates.get('cart_rate', 0)}%</td></tr>
    <tr><td>Compras</td><td>{funnel.get('purchases', 0):,}</td><td>{rates.get('purchase_rate', 0)}%</td></tr>
  </table>

  <h2>Liga Pass</h2>
  <table>
    <tr><th>Nível</th><th>Usuários</th></tr>
    {xp_rows or '<tr><td colspan="2">Sem dados</td></tr>'}
  </table>

  <h2>Recomendações</h2>
  {recs_html}

  <div class="footer">
    <p>Gerado em {datetime.now(UTC).strftime('%d/%m/%Y %H:%M')} UTC</p>
    <p><a href="https://judgetcg.com.br/admin/retention">Ver dashboard completo</a></p>
  </div>
</body>
</html>"""


def _save_report_fallback(html: str) -> str:
    out_dir = Path(os.getenv("WEEKLY_REPORT_DIR", "."))
    out_dir.mkdir(parents=True, exist_ok=True)
    path = out_dir / f"weekly_report_{datetime.now(UTC).strftime('%Y%m%d')}.html"
    path.write_text(html, encoding="utf-8")
    return str(path)


async def send_weekly_email(report: dict[str, Any]) -> dict[str, Any]:
    to = os.getenv("WEEKLY_REPORT_EMAIL", "admin@judgetcg.com.br").strip()
    api_key = os.getenv("RESEND_API_KEY", "").strip()
    from_email = os.getenv("RESEND_FROM_EMAIL", "Judge TCG <alertas@judgetcg.com.br>").strip()
    html = render_weekly_email_html(report)
    subject = f"Weekly Report — Judge-TCG ({report['period']['start']} a {report['period']['end']})"

    if not api_key:
        path = _save_report_fallback(html)
        logger.info("weekly_report_stub_saved", path=path, to=to)
        return {"sent": False, "reason": "RESEND_API_KEY not set", "saved_to": path, "report": report}

    payload = {"from": from_email, "to": [to], "subject": subject, "html": html}

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            res = await client.post(
                RESEND_API_URL,
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json=payload,
            )
        if res.status_code >= 400:
            path = _save_report_fallback(html)
            logger.warning("weekly_report_failed", status=res.status_code, saved_to=path)
            return {"sent": False, "reason": res.text[:300], "saved_to": path}
        logger.info("weekly_report_sent", to=to)
        return {"sent": True, "to": to}
    except Exception as exc:
        path = _save_report_fallback(html)
        logger.exception("weekly_report_error")
        return {"sent": False, "reason": str(exc), "saved_to": path}


async def run_weekly_report_job() -> dict[str, Any]:
    report = await generate_weekly_report()
    result = await send_weekly_email(report)
    result["report_summary"] = {
        "wau": report["metrics"].get("wau"),
        "purchases": (report["metrics"].get("funnel") or {}).get("purchases"),
        "gmv_brl": report["metrics"].get("gmv_brl"),
    }
    return result


def main() -> None:
    result = asyncio.run(run_weekly_report_job())
    print(result)


if __name__ == "__main__":
    main()
