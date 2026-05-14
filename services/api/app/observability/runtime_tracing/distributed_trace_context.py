"""Contexto de trace distribuído (IDs + span stack lógica; OTEL export opcional)."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from app.observability.tracing_runtime import get_trace_id, new_trace_id


@dataclass
class TraceContext:
    trace_id: str
    span_stack: list[str] = field(default_factory=list)

    def push(self, name: str) -> None:
        self.span_stack.append(name)

    def pop(self) -> str | None:
        return self.span_stack.pop() if self.span_stack else None


def current_trace_context() -> TraceContext:
    tid = get_trace_id() or new_trace_id()
    return TraceContext(trace_id=tid, span_stack=[])


def fork_trace_context(*, label: str) -> dict[str, Any]:
    """Ramifica contexto lógico (ex.: worker) sem colapsar trace principal."""
    base = get_trace_id() or new_trace_id()
    return {"parent_trace_id": base, "fork_id": new_trace_id(), "label": label}


def attach_child_span(parent: str, child: str) -> dict[str, Any]:
    return {"parent": parent, "child": child, "trace_id": get_trace_id()}
