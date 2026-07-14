"""Official Metric Registry (Beta 2). Source: docs/product/METRIC_REGISTRY.md."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True, slots=True)
class MetricDef:
    id: str
    name: str
    description: str
    category: str
    owner: str
    version: str
    formula: str
    source: str  # mart name / domain
    refresh_interval: str
    granularity: str
    unit: str
    target: str | None = None
    warning_threshold: float | None = None
    critical_threshold: float | None = None
    consumers: tuple[str, ...] = ()


def _m(**kwargs: Any) -> MetricDef:
    return MetricDef(**kwargs)


METRIC_DEFINITIONS: tuple[MetricDef, ...] = (
    _m(
        id="orders_completed",
        name="Orders Completed",
        description="Pedidos concluídos",
        category="marketplace",
        owner="marketplace",
        version="v1",
        formula="COUNT(order.status=completed)",
        source="mart_orders",
        refresh_interval="5m",
        granularity="daily",
        unit="count",
        target="up",
        consumers=("executive", "marketplace", "north_star"),
    ),
    _m(
        id="gmv",
        name="GMV",
        description="Volume bruto negociado",
        category="marketplace",
        owner="marketplace",
        version="v1",
        formula="SUM(order.total)",
        source="mart_orders",
        refresh_interval="5m",
        granularity="daily",
        unit="currency",
        consumers=("executive", "marketplace", "north_star"),
    ),
    _m(
        id="average_order_value",
        name="AOV",
        description="Ticket médio",
        category="marketplace",
        owner="marketplace",
        version="v1",
        formula="gmv / orders_completed",
        source="mart_orders",
        refresh_interval="5m",
        granularity="daily",
        unit="currency",
        consumers=("executive", "marketplace"),
    ),
    _m(
        id="buyers_active",
        name="Active Buyers",
        description="Compradores ativos na janela",
        category="buyer",
        owner="buyer",
        version="v1",
        formula="COUNT DISTINCT buyers with purchase",
        source="mart_buyers",
        refresh_interval="5m",
        granularity="7d",
        unit="count",
        consumers=("executive", "north_star", "buyer"),
    ),
    _m(
        id="sellers_active",
        name="Active Sellers",
        description="Sellers com venda na janela",
        category="seller",
        owner="seller",
        version="v1",
        formula="COUNT DISTINCT sellers with sale",
        source="mart_sellers",
        refresh_interval="5m",
        granularity="7d",
        unit="count",
        consumers=("executive", "north_star", "seller"),
    ),
    _m(
        id="conversion_rate",
        name="Conversion Rate",
        description="Search→Order ou sessions→purchase",
        category="product",
        owner="product",
        version="v1",
        formula="orders / searches_or_sessions",
        source="mart_conversion",
        refresh_interval="5m",
        granularity="7d",
        unit="percentage",
        warning_threshold=0.01,
        critical_threshold=0.005,
        consumers=("executive", "product_health", "alerts"),
    ),
    _m(
        id="sessions",
        name="Sessions",
        description="Sessões com page_view",
        category="product",
        owner="product",
        version="v1",
        formula="COUNT DISTINCT session_id",
        source="mart_buyers",
        refresh_interval="5m",
        granularity="daily",
        unit="count",
        consumers=("buyer", "executive"),
    ),
    _m(
        id="active_users",
        name="Active Users",
        description="Usuários únicos 24h",
        category="product",
        owner="product",
        version="v1",
        formula="COUNT DISTINCT user/anon 24h",
        source="mart_buyers",
        refresh_interval="5m",
        granularity="daily",
        unit="count",
        consumers=("buyer", "executive"),
    ),
    _m(
        id="search_ctr",
        name="Search CTR",
        description="Cliques / buscas",
        category="search",
        owner="search",
        version="v1",
        formula="clicks / searches",
        source="mart_search",
        refresh_interval="5m",
        granularity="daily",
        unit="ratio",
        warning_threshold=0.2,
        critical_threshold=0.1,
        consumers=("search", "alerts"),
    ),
    _m(
        id="search_zero_results",
        name="Zero Results Rate",
        description="Buscas sem resultado",
        category="search",
        owner="search",
        version="v1",
        formula="zero_result_searches / searches",
        source="mart_search",
        refresh_interval="5m",
        granularity="daily",
        unit="percentage",
        warning_threshold=0.25,
        critical_threshold=0.4,
        consumers=("search", "alerts"),
    ),
    _m(
        id="search_success",
        name="Search Success",
        description="1 - zero_results",
        category="search",
        owner="search",
        version="v1",
        formula="1 - search_zero_results",
        source="mart_search",
        refresh_interval="5m",
        granularity="daily",
        unit="percentage",
        consumers=("search", "product_health", "alerts"),
    ),
    _m(
        id="product_health_score",
        name="Product Health Score",
        description="Índice composto 0-100",
        category="quality",
        owner="product",
        version="v1",
        formula="weighted pillars",
        source="mart_product_health",
        refresh_interval="5m",
        granularity="5m",
        unit="score",
        warning_threshold=80,
        critical_threshold=70,
        consumers=("executive", "alerts", "operations"),
    ),
    _m(
        id="analytics_health_score",
        name="Analytics Health Score",
        description="Confiança da ingestão",
        category="analytics",
        owner="platform",
        version="v1",
        formula="AHS components",
        source="mart_product_health",
        refresh_interval="5m",
        granularity="5m",
        unit="score",
        warning_threshold=75,
        critical_threshold=50,
        consumers=("analytics", "alerts"),
    ),
    _m(
        id="north_star_orders_7d",
        name="North Star Orders 7d",
        description="Pedidos concluídos últimos 7 dias",
        category="marketplace",
        owner="product",
        version="v1",
        formula="orders_completed window 7d",
        source="mart_north_star",
        refresh_interval="5m",
        granularity="7d",
        unit="count",
        consumers=("executive", "north_star"),
    ),
    _m(
        id="retention_d7",
        name="Retention D7",
        description="Retenção dia 7",
        category="product",
        owner="product",
        version="v1",
        formula="cohort retained / cohort size",
        source="mart_cohorts",
        refresh_interval="1h",
        granularity="cohort",
        unit="percentage",
        consumers=("buyer", "cohorts"),
    ),
    _m(
        id="wishlist_conversion",
        name="Wishlist Conversion",
        description="Listas convertidas / criadas",
        category="buyer",
        owner="buyer",
        version="v1",
        formula="converted / created",
        source="mart_funnels",
        refresh_interval="5m",
        granularity="7d",
        unit="percentage",
        consumers=("buyer", "funnels"),
    ),
    _m(
        id="runtime_health_score",
        name="Runtime Health Score",
        description="Saúde do Analytics Runtime",
        category="analytics",
        owner="platform",
        version="v1",
        formula="latency+cache+availability",
        source="mart_alerts",
        refresh_interval="1m",
        granularity="1m",
        unit="score",
        consumers=("operations", "analytics"),
    ),
)

METRIC_REGISTRY: dict[str, MetricDef] = {m.id: m for m in METRIC_DEFINITIONS}

VALID_MART_SOURCES = frozenset(
    {
        "mart_orders",
        "mart_search",
        "mart_conversion",
        "mart_buyers",
        "mart_sellers",
        "mart_catalog",
        "mart_product_health",
        "mart_north_star",
        "mart_funnels",
        "mart_cohorts",
        "mart_alerts",
        "mart_top_movers",
        "mart_marketplace",
        "mart_product_metrics",
    }
)


def validate_registry() -> list[str]:
    """Return list of consistency errors (empty = ok)."""
    errors: list[str] = []
    seen: set[str] = set()
    for m in METRIC_DEFINITIONS:
        if m.id in seen:
            errors.append(f"duplicate id: {m.id}")
        seen.add(m.id)
        if not m.id.isidentifier() and "_" not in m.id:
            errors.append(f"invalid id: {m.id}")
        if m.source not in VALID_MART_SOURCES:
            errors.append(f"{m.id}: unknown source mart {m.source}")
        if not m.owner or not m.formula or not m.version:
            errors.append(f"{m.id}: missing required fields")
    return errors


def resolve_metric(metric_id: str) -> MetricDef:
    if metric_id not in METRIC_REGISTRY:
        raise KeyError(f"Unknown metric: {metric_id}")
    return METRIC_REGISTRY[metric_id]


def list_metrics(*, category: str | None = None, consumer: str | None = None) -> list[MetricDef]:
    out = list(METRIC_DEFINITIONS)
    if category:
        out = [m for m in out if m.category == category]
    if consumer:
        out = [m for m in out if consumer in m.consumers]
    return out
