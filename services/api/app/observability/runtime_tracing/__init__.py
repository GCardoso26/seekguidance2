"""Tracing de runtime (retrieval → reasoning → replay) — incremental, sem quebrar OTEL existente."""

from app.observability.runtime_tracing.branch_explosion_alerts import branch_explosion_alerts
from app.observability.runtime_tracing.distributed_trace_context import (
    TraceContext,
    attach_child_span,
    current_trace_context,
    fork_trace_context,
)
from app.observability.runtime_tracing.graph_expansion_tracing import graph_expansion_span_meta
from app.observability.runtime_tracing.graph_runtime_diagnostics import graph_runtime_diagnostics
from app.observability.runtime_tracing.otel_runtime_exporter import build_otel_exporter_config
from app.observability.runtime_tracing.replay_diagnostics import replay_diagnostics_bundle
from app.observability.runtime_tracing.replay_trace_correlation import correlate_replay_to_trace
from app.observability.runtime_tracing.replay_trace_exporter import export_replay_trace_bundle
from app.observability.runtime_tracing.retrieval_reasoning_correlation import (
    pipeline_correlation_bundle,
)
from app.observability.runtime_tracing.semantic_pipeline_exporter import export_semantic_pipeline
from app.observability.runtime_tracing.semantic_trace_spans import SpanNames, semantic_span_tree
from app.observability.runtime_tracing.symbolic_pipeline_tracing import symbolic_pipeline_span_meta

__all__ = [
    "SpanNames",
    "TraceContext",
    "attach_child_span",
    "branch_explosion_alerts",
    "build_otel_exporter_config",
    "correlate_replay_to_trace",
    "current_trace_context",
    "export_replay_trace_bundle",
    "export_semantic_pipeline",
    "fork_trace_context",
    "graph_expansion_span_meta",
    "graph_runtime_diagnostics",
    "pipeline_correlation_bundle",
    "replay_diagnostics_bundle",
    "semantic_span_tree",
    "symbolic_pipeline_span_meta",
]
