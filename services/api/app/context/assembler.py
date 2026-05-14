"""Montagem hierárquica do prompt: compressão + orçamento + mapeamento de citações."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

import structlog

from app.context.budgeting import build_budget, estimate_tokens
from app.context.compressor import compress_preserving_legal_semantics
from app.context.hierarchy import group_hits_for_assembly
from app.context.prompt_blocks import PromptBlock, _temporal_origin_label, assign_block_ids, block_importance
from app.context.summarizer import envelope_atomic, envelope_parent, envelope_sibling
from app.context.temporal import TemporalHint, apply_temporal_ranking
from app.core.config import Settings
from app.query_understanding.semantic_router import RetrievalHint
from app.retrieval.temporal_scoring import compute_temporal_score
from app.retrieval.types import ChunkHit

logger = structlog.get_logger(__name__)


@dataclass
class AssembledPrompt:
    system_supplement: str
    user_context_block: str
    citation_index: str
    metrics: dict[str, Any] = field(default_factory=dict)
    trace_blocks: list[PromptBlock] = field(default_factory=list)


class ContextAssemblyEngine:
    """
    Pipeline: hierarchy_grouping → compression → budgeting → prompt assembly.
    `legal_semantic_summary` = envelopes + compressão conservadora (sem LLM).
    """

    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    def assemble(
        self,
        *,
        question: str,
        mode: str,
        hits: list[ChunkHit],
        hint: RetrievalHint,
        temporal: TemporalHint,
    ) -> AssembledPrompt:
        ordered = list(hits)
        for h in ordered:
            h.temporal_score = compute_temporal_score(h, temporal, self._settings)
        if temporal.prefer_historical:
            ordered = apply_temporal_ranking(ordered)

        bundle = group_hits_for_assembly(ordered)
        budget = build_budget(
            self._settings.context_token_budget_total,
            reserved_answer=self._settings.context_token_budget_reserved_answer,
        )

        # quotas por camada (tokens aproximados)
        p_budget = int(budget.available_for_context * 0.22)
        a_budget = int(budget.available_for_context * 0.58)
        s_budget = int(budget.available_for_context * 0.20)

        enc = self._settings.context_token_encoding_model
        candidates: list[PromptBlock] = []

        # Parents
        p_chars = max(400, p_budget * 3)
        n_par = max(1, min(8, len(bundle.parents)))
        for h in bundle.parents[:8]:
            body = envelope_parent(h, max_chars=min(900, p_chars // n_par))
            imp = block_importance(h, question=question, temporal=temporal, settings=self._settings)
            cid = str(h.chunk_id)
            candidates.append(
                PromptBlock(
                    block_id="",
                    section_kind="parent",
                    text=body,
                    source_chunk_ids=[cid],
                    citation_ids=[cid],
                    hierarchy_origin=h.rule_path or h.semantic_path,
                    temporal_origin=_temporal_origin_label(h, temporal),
                    importance_score=imp,
                )
            )

        # Atomic
        a_chars = max(500, a_budget * 3)
        n_atom = max(1, min(12, len(bundle.atomic)))
        for h in bundle.atomic[:12]:
            body = envelope_atomic(h, max_chars=min(2200, a_chars // min(n_atom, 4)))
            imp = block_importance(h, question=question, temporal=temporal, settings=self._settings)
            cid = str(h.chunk_id)
            candidates.append(
                PromptBlock(
                    block_id="",
                    section_kind="atomic",
                    text=body,
                    source_chunk_ids=[cid],
                    citation_ids=[cid],
                    hierarchy_origin=h.rule_path or h.semantic_path,
                    temporal_origin=_temporal_origin_label(h, temporal),
                    importance_score=imp,
                )
            )

        # Siblings
        s_chars = max(300, s_budget * 3)
        n_sib = max(1, min(6, len(bundle.siblings)))
        for h in bundle.siblings[:6]:
            body = envelope_sibling(h, max_chars=min(700, s_chars // n_sib))
            imp = block_importance(h, question=question, temporal=temporal, settings=self._settings)
            cid = str(h.chunk_id)
            candidates.append(
                PromptBlock(
                    block_id="",
                    section_kind="sibling",
                    text=body,
                    source_chunk_ids=[cid],
                    citation_ids=[cid],
                    hierarchy_origin=h.rule_path or h.semantic_path,
                    temporal_origin=_temporal_origin_label(h, temporal),
                    importance_score=imp,
                )
            )

        assign_block_ids(candidates)
        n_before = len(candidates)
        packed, dropped_tokens_est, n_pruned = self._pack_blocks_by_priority(
            candidates,
            token_limit=budget.available_for_context,
            encoding_model=enc,
        )
        cite_lines: list[str] = []
        sections: list[str] = []
        for i, blk in enumerate(packed, start=1):
            blk.citation_display_index = i
            sections.append(blk.text)
            h = next((x for x in ordered if str(x.chunk_id) in blk.source_chunk_ids), None)
            if h is not None:
                cite_lines.append(_cite_line(i, h))
            else:
                cite_lines.append(f"[{i}] trace={blk.block_id} chunks={','.join(blk.source_chunk_ids)}")

        merged = "\n\n---\n\n".join(sections)
        merged = self._trim_to_token_budget(merged, budget.available_for_context, ordered, enc)

        intent = hint.analysis.primary.value
        doc_focus = ", ".join(hint.doc_types) if hint.doc_types else "all indexed"
        temporal_note = (
            "The user is asking about older rules or past rules text. "
            "Prefer passages that match the indicated time window; "
            "if versions conflict, explain briefly and stay factual."
            if temporal.prefer_historical
            else "Default: explain using current indexed rules unless the question is explicitly historical."
        )
        if temporal.as_of:
            temporal_note += (
                f" Snapshot date hint: {temporal.as_of} (retrieval already filtered to versions active on that date)."
            )

        system_supplement = (
            f"QUERY_INTENT={intent}; ROUTED_DOC_FAMILIES={doc_focus}; "
            f"CLASSIFIER_CONFIDENCE={hint.analysis.confidence:.2f}. "
            f"{temporal_note} "
            "CONTEXT is gameplay-oriented: parent summaries, atomic rule excerpts, sibling cross-references. "
            "Preserve timing words, exceptions, and 'when/while' clauses. "
            "If the context does not contain the needed rule, say so clearly."
        )

        user_block = (
            f"## Structured context (judge-grade assembly)\n"
            f"MODE={mode}\n"
            f"QUESTION:\n{question}\n\n"
            f"## Hierarchical passages\n"
            f"{merged}\n\n"
            f"## Citation index (map passage numbers to sources)\n" + "\n".join(cite_lines)
        )

        raw_tokens = estimate_tokens(user_block, model_encoding=enc)
        denom = sum(len(h.text) for h in ordered) or 1
        redundancy = 1.0 - (len(merged) / denom)

        mean_temporal = sum(h.temporal_score for h in ordered) / len(ordered) if ordered else 0.0
        metrics = {
            "prompt_context_tokens_est": raw_tokens,
            "token_budget_total": budget.total,
            "token_budget_available_context": budget.available_for_context,
            "compression_redundancy_ratio": round(max(0.0, min(1.0, redundancy)), 4),
            "hierarchy_depth_max": max((h.hierarchy_level for h in ordered), default=0),
            "n_parents": len(bundle.parents),
            "n_atomic": len(bundle.atomic),
            "n_siblings": len(bundle.siblings),
            "temporal_prefer_historical": temporal.prefer_historical,
            "temporal_as_of_set": bool(temporal.as_of),
            "temporal_score_mean": round(mean_temporal, 4),
            "pruning_blocks_before": n_before,
            "pruning_blocks_after": len(packed),
            "pruning_blocks_dropped": n_pruned,
            "pruning_est_tokens_dropped": dropped_tokens_est,
            "trace_block_count": len(packed),
            "intent": intent,
        }
        logger.info("context.assembly.done", **metrics)
        return AssembledPrompt(
            system_supplement=system_supplement,
            user_context_block=user_block,
            citation_index="\n".join(cite_lines),
            metrics=metrics,
            trace_blocks=packed,
        )

    def _pack_blocks_by_priority(
        self,
        blocks: list[PromptBlock],
        *,
        token_limit: int,
        encoding_model: str,
    ) -> tuple[list[PromptBlock], int, int]:
        """Ordena por importância e enche o orçamento; blocos de baixa prioridade caem primeiro."""
        if not blocks:
            return [], 0, 0
        header_reserve = min(900, max(120, int(token_limit * 0.12)))
        cap = max(200, token_limit - header_reserve)
        ordered = sorted(blocks, key=lambda b: -b.importance_score)
        packed: list[PromptBlock] = []
        used = 0
        dropped_toks = 0
        for b in ordered:
            t = estimate_tokens(b.text, model_encoding=encoding_model)
            if used + t <= cap:
                packed.append(b)
                used += t
            else:
                dropped_toks += t
        if not packed:
            b0 = max(blocks, key=lambda x: x.importance_score)
            packed = [b0]
            total_all = sum(estimate_tokens(x.text, model_encoding=encoding_model) for x in blocks)
            b0_tok = estimate_tokens(b0.text, model_encoding=encoding_model)
            dropped_toks = max(0, total_all - b0_tok)
        kind_order = {"parent": 0, "atomic": 1, "sibling": 2}
        packed.sort(key=lambda b: (kind_order.get(b.section_kind, 9), -b.importance_score))
        return packed, dropped_toks, max(0, len(blocks) - len(packed))

    def _trim_to_token_budget(
        self,
        text: str,
        token_limit: int,
        hits: list[ChunkHit],
        encoding_model: str | None = None,
    ) -> str:
        enc = encoding_model or self._settings.context_token_encoding_model
        if estimate_tokens(text, model_encoding=enc) <= token_limit:
            return text
        return compress_preserving_legal_semantics(text, max_chars=max(2000, token_limit * 3))


def _cite_line(idx: int, h: ChunkHit) -> str:
    path = h.rule_path or h.semantic_path or "?"
    return f"[{idx}] {h.document_title} | {path} | {h.source_url} | hash={h.document_content_hash or 'n/a'}"
