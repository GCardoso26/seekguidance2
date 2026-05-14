"""Convenções de spans semânticos (nomes estáveis para Grafana/Tempo)."""

from __future__ import annotations

from typing import Any

from app.observability.tracing_runtime import get_trace_id


class SpanNames:
    RETRIEVAL = "tcg.semantic.retrieval"
    RERANK = "tcg.semantic.rerank"
    REASONING = "tcg.semantic.reasoning"
    REPLAY_VALIDATE = "tcg.replay.validate"
    GRAPH_EXPAND = "tcg.graph.expand"
    ONTOLOGY_ENRICH = "tcg.ontology.enrich"
    TEMPORAL = "tcg.temporal.lineage"
    SYMBOLIC_SIM = "tcg.symbolic.simulation"


def semantic_span_tree(phases: list[str]) -> dict[str, Any]:
    return {"root": SpanNames.RETRIEVAL, "phases": phases, "trace_id": get_trace_id()}
