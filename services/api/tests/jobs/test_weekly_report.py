"""Testes do gerador de relatório semanal."""

from app.jobs.weekly_report import (
    calc_change,
    generate_highlights,
    generate_recommendations,
)


def test_calc_change():
    assert calc_change(10, 5) == 100.0
    assert calc_change(0, 5) == -100.0
    assert calc_change(5, 0) == 0.0


def test_generate_highlights_purchases():
    metrics = {"funnel": {"purchases": 3}, "funnel_rates": {}, "xp_distribution": []}
    highlights = generate_highlights(metrics, {})
    assert any("3 compras" in h for h in highlights)


def test_generate_recommendations_low_gmv():
    recs = generate_recommendations({"funnel_rates": {}, "gmv_brl": 0})
    assert any("GMV zerado" in r for r in recs)
