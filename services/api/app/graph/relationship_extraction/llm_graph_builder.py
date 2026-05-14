"""Inferência assistida por LLM para enriquecer o grafo — destina-se a jobs offline."""

from __future__ import annotations

import json
import re
from typing import Any

import structlog
from openai import AsyncOpenAI

from app.core.config import Settings

logger = structlog.get_logger(__name__)


def _strip_json_fence(raw: str) -> str:
    t = raw.strip()
    if t.startswith("```"):
        t = re.sub(r"^```[a-zA-Z]*\n?", "", t)
        t = re.sub(r"\n?```$", "", t)
    return t.strip()


async def llm_propose_edges_from_snippets(
    snippets: list[dict[str, Any]],
    *,
    settings: Settings,
) -> list[dict[str, Any]]:
    """
    Cada snippet: { "rule_path": "...", "text": "..." } (texto curto).
    Devolve lista de dicts com chaves alinhadas a InferredRuleEdge (strings JSON-friendly).
    """
    if not snippets or not settings.openai_api_key:
        return []

    client = AsyncOpenAI(api_key=settings.openai_api_key)
    system = (
        "You are a Magic: The Gathering rules graph assistant. "
        "Propose gameplay-oriented relationships between rule NUMBER HEADINGS only "
        "(e.g. 614 and 704), not legal doctrines. "
        "Output a single JSON object with key edges: array of objects with: "
        "source_rule_id, target_rule_id, relationship_type, confidence (0-1), "
        "evidence (array of short strings), relationship_score (0-1). "
        "Use relationship_type one of: references, interacts_with, modifies, depends_on, "
        "overrides, timing_related, replacement_interaction, stack_interaction, "
        "state_based_dependency, gameplay_dependency."
    )
    user = json.dumps({"snippets": snippets[:24]}, ensure_ascii=False)
    resp = await client.chat.completions.create(
        model=settings.default_chat_model,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        response_format={"type": "json_object"},
        temperature=0.1,
    )
    raw = resp.choices[0].message.content or "{}"
    try:
        data = json.loads(_strip_json_fence(raw))
    except json.JSONDecodeError:
        logger.warning("llm_graph_builder.json_error", raw=raw[:400])
        return []
    edges = data.get("edges")
    if not isinstance(edges, list):
        return []
    out: list[dict[str, Any]] = []
    for e in edges:
        if not isinstance(e, dict):
            continue
        src = str(e.get("source_rule_id", "")).strip()
        dst = str(e.get("target_rule_id", "")).strip()
        if not src.isdigit() or not dst.isdigit() or src == dst:
            continue
        out.append(
            {
                "source_rule_id": src,
                "target_rule_id": dst,
                "relationship_type": str(e.get("relationship_type", "gameplay_dependency")),
                "confidence": float(e.get("confidence", 0.0) or 0.0),
                "evidence": e.get("evidence") if isinstance(e.get("evidence"), list) else ["llm_inference"],
                "relationship_score": float(e.get("relationship_score", 0.0) or 0.0),
            }
        )
    return out
