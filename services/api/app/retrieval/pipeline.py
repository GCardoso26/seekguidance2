"""Pipeline judge-grade: híbrido denso+lexical → diversificar → expandir → dedup → rerank."""

from __future__ import annotations

import math
import time
from uuid import UUID, uuid4

import structlog
from openai import AsyncOpenAI
from sqlalchemy.ext.asyncio import AsyncSession

from app.context.temporal import TemporalHint
from app.core.config import Settings
from app.graph.adaptive_expansion import compute_graph_expansion_limit
from app.graph.feedback.retrieval_outcome_tracking import fetch_retrieval_quality_ema
from app.graph.graph_retrieval import expand_hits_with_graph
from app.query_understanding.decomposition import decompose_query
from app.query_understanding.routing_v2 import resolve_reasoning_route
from app.query_understanding.semantic_router import RetrievalHint, route_query
from app.retrieval.confidence import (
    ConfidenceSignals,
    compute_confidence,
    count_distinct_rule_sources,
    score_spread_from_list,
    vec_lex_agreement,
)
from app.retrieval.confidence_profiles import get_confidence_profile
from app.retrieval.deduplication import deduplicate_by_embedding
from app.retrieval.diversification import diversify_hits
from app.retrieval.expansion import expand_context, fetch_chunk_rows, fetch_embeddings_for
from app.retrieval.explanations import build_explainability_v2, build_retrieval_explanations
from app.retrieval.fusion import (
    cosine_distance_to_similarity,
    merge_rrf_and_weighted,
    normalize_lexical_ranks,
)
from app.retrieval.outcome import RetrievalOutcome
from app.retrieval.rerank import RankedChunk, build_reranker
from app.retrieval.sql_retrieval import search_lexical_hits, search_vector_hits, vec_literal
from app.retrieval.temporal_scoring import composite_retrieval_score, compute_temporal_score
from app.retrieval.types import ChunkHit

logger = structlog.get_logger(__name__)


def _hits_from_rows(
    ids: list[UUID],
    fused: dict[UUID, float],
    vec_s: dict[UUID, float],
    lex_s: dict[UUID, float],
    rows: dict[UUID, dict],
) -> list[ChunkHit]:
    out: list[ChunkHit] = []
    for uid in ids:
        r = rows.get(uid)
        if not r:
            continue
        meta_raw = r.get("metadata") or {}
        meta = dict(meta_raw) if isinstance(meta_raw, dict) else {}
        if r.get("doc_type"):
            meta["doc_type"] = r["doc_type"]
        if r.get("chunk_created_at") is not None:
            meta["chunk_created_at"] = str(r["chunk_created_at"])
        if r.get("version_effective_from") is not None:
            meta["version_effective_from"] = str(r["version_effective_from"])
        if r.get("version_effective_to") is not None:
            meta["version_effective_to"] = str(r["version_effective_to"])
        out.append(
            ChunkHit(
                chunk_id=r["id"],
                document_id=r["document_id"],
                text=r["text"],
                rule_path=r.get("rule_path"),
                semantic_path=r.get("semantic_path"),
                parent_chunk_id=r.get("parent_chunk_id"),
                hierarchy_level=int(r.get("hierarchy_level") or 0),
                document_title=r["title"],
                source_url=r["source_url"],
                content_sha256=r.get("content_sha256"),
                version_label=r.get("version_label"),
                document_content_hash=r.get("content_hash"),
                metadata=meta,
                vector_score=vec_s.get(uid, 0.0),
                bm25_score=lex_s.get(uid, 0.0),
                fused_score=fused.get(uid, 0.0),
                rerank_score=None,
                temporal_score=0.0,
                expansion_source="atomic",
            )
        )
    return out


class RetrievalPipeline:
    """Serviço de retrieval desacoplado do router FastAPI."""

    def __init__(self, session: AsyncSession, game_id: UUID, settings: Settings) -> None:
        self._session = session
        self._game_id = game_id
        self._settings = settings
        self._reranker = build_reranker(
            enabled=settings.reranker_enabled,
            model_name=settings.reranker_model,
            batch_size=settings.reranker_batch_size,
        )

    async def _embed_query(self, question: str) -> list[float]:
        if not self._settings.openai_api_key:
            raise RuntimeError("OPENAI_API_KEY ausente para embedding de consulta")
        client = AsyncOpenAI(api_key=self._settings.openai_api_key)
        dim = self._settings.openai_embedding_dimensions
        resp = await client.embeddings.create(
            model=self._settings.default_embedding_model,
            input=[question],
            dimensions=dim,
        )
        return list(resp.data[0].embedding)

    async def run(
        self,
        question: str,
        *,
        top_k: int = 10,
        hint: RetrievalHint | None = None,
        temporal: TemporalHint | None = None,
        game_slug: str = "mtg",
    ) -> RetrievalOutcome:
        if temporal is None:
            temporal = TemporalHint(prefer_historical=False, as_of=None)
        qid = uuid4()
        rh = hint or route_query(question, prefer_historical=temporal.prefer_historical)
        decomposition = decompose_query(question, rh)
        strategy, merged_seeds = resolve_reasoning_route(rh, decomposition, temporal, game_slug=game_slug)

        quality_ema: float | None = None
        try:
            quality_ema = await fetch_retrieval_quality_ema(self._session, self._game_id)
        except Exception:
            quality_ema = None

        t0 = time.perf_counter()
        emb = await self._embed_query(question)
        vec_lit = vec_literal(emb)

        doc_types = rh.doc_types
        lex_base = rh.lexical_query
        lex_question = f"{lex_base} {decomposition.lexical_augmentation}".strip()[:1200]
        t_as_of = temporal.as_of
        t_hist = temporal.prefer_historical

        t_vec = time.perf_counter()
        vec_rows = await search_vector_hits(
            self._session,
            self._game_id,
            vec_lit,
            limit=self._settings.retrieval_vector_candidate_limit,
            doc_types=doc_types,
            as_of=t_as_of,
            prefer_historical=t_hist,
        )
        ms_vec = (time.perf_counter() - t_vec) * 1000.0

        t_lex = time.perf_counter()
        lex_rows = await search_lexical_hits(
            self._session,
            self._game_id,
            lex_question,
            limit=self._settings.retrieval_lexical_candidate_limit,
            doc_types=doc_types,
            as_of=t_as_of,
            prefer_historical=t_hist,
        )
        ms_lex = (time.perf_counter() - t_lex) * 1000.0

        vec_ids = [r[0] for r in vec_rows]
        lex_ids = [r[0] for r in lex_rows]

        vec_dist = {r[0]: float(r[1]) for r in vec_rows}
        lex_raw = {r[0]: float(r[1]) for r in lex_rows}

        if self._settings.retrieval_decomposition_extra_lexical and decomposition.sub_queries:
            cap = self._settings.retrieval_decomposition_subquery_cap
            for sq in decomposition.sub_queries[:cap]:
                sq_clean = sq.strip()
                if len(sq_clean) < 6:
                    continue
                rows_x = await search_lexical_hits(
                    self._session,
                    self._game_id,
                    sq_clean,
                    limit=min(24, self._settings.retrieval_lexical_candidate_limit),
                    doc_types=doc_types,
                    as_of=t_as_of,
                    prefer_historical=t_hist,
                )
                for uid, rank in rows_x:
                    lex_raw[uid] = max(lex_raw.get(uid, 0.0), float(rank))
                    if uid not in lex_ids:
                        lex_ids.append(uid)

        vec_sim = {u: cosine_distance_to_similarity(d) for u, d in vec_dist.items()}
        lex_norm = normalize_lexical_ranks(lex_raw)

        fused_scores = merge_rrf_and_weighted(
            vec_ids=vec_ids,
            lex_ids=lex_ids,
            vector_scores=vec_sim,
            lexical_scores=lex_norm,
            vector_weight=strategy.vector_weight,
            lexical_weight=strategy.lexical_weight,
            rrf_blend=strategy.rrf_blend,
        )

        ranked_ids = sorted(fused_scores.keys(), key=lambda i: -fused_scores[i])[
            : self._settings.retrieval_fused_pool_size
        ]

        t_fetch = time.perf_counter()
        rows = await fetch_chunk_rows(self._session, ranked_ids)
        ms_fetch = (time.perf_counter() - t_fetch) * 1000.0

        hits = _hits_from_rows(ranked_ids, fused_scores, vec_sim, lex_norm, rows)
        hits.sort(key=lambda h: -h.fused_score)

        seeds = diversify_hits(
            hits,
            max_total=self._settings.retrieval_diversify_seed_cap,
            max_per_chapter=self._settings.retrieval_max_per_chapter,
            max_per_document=self._settings.retrieval_max_per_document,
        )

        t_exp = time.perf_counter()
        expanded = await expand_context(
            self._session,
            seeds,
            max_ancestors=self._settings.retrieval_max_ancestors,
            max_siblings_per_seed=self._settings.retrieval_max_siblings_per_seed,
        )
        ms_expand = (time.perf_counter() - t_exp) * 1000.0

        emb_ids = [h.chunk_id for h in expanded]
        t_emb = time.perf_counter()
        embs = await fetch_embeddings_for(self._session, emb_ids)
        ms_emb = (time.perf_counter() - t_emb) * 1000.0

        deduped = deduplicate_by_embedding(
            expanded,
            embs,
            threshold=self._settings.retrieval_dedup_threshold,
        )

        token_budget_ctx = (
            self._settings.context_token_budget_total - self._settings.context_token_budget_reserved_answer
        )
        eff_limit = compute_graph_expansion_limit(
            self._settings,
            query_complexity=decomposition.complexity,
            classifier_confidence=rh.analysis.confidence,
            token_budget_available=token_budget_ctx,
            intent_label=rh.analysis.primary.value,
            graph_expansion_scale=strategy.graph_expansion_scale,
            retrieval_quality_ema=quality_ema,
        )

        eff_mins = [
            x
            for x in (self._settings.graph_edge_min_relationship_score, strategy.edge_min_relationship_score)
            if x is not None
        ]
        eff_edge_min = max(eff_mins) if eff_mins else None

        graph_ids: list[UUID] = []
        edge_trace: list[str] = []
        t_graph = time.perf_counter()
        try:
            graph_ids, edge_trace = await expand_hits_with_graph(
                self._session,
                self._game_id,
                deduped,
                graph_extra_limit=eff_limit,
                exclude={h.chunk_id for h in deduped},
                extra_rule_heads=list(merged_seeds),
                edge_min_relationship_score=eff_edge_min,
                max_seed_heads=self._settings.graph_max_seed_heads,
            )
        except Exception:  # pragma: no cover - DB opcional / schema antigo
            logger.warning("retrieval.graph.expand_failed", exc_info=True)
            graph_ids = []
            edge_trace = []
        if graph_ids:
            rows_g = await fetch_chunk_rows(self._session, graph_ids)
            for uid in graph_ids:
                fused_scores.setdefault(uid, 0.12)
            ghits = _hits_from_rows(graph_ids, fused_scores, vec_sim, lex_norm, rows_g)
            bonus = self._settings.graph_retrieval_score_bonus
            for h in ghits:
                h.metadata["graph_expanded"] = True
                h.fused_score = min(1.0, float(h.fused_score) + bonus)
            merged_hits = list(deduped) + ghits
            emb_ids2 = [h.chunk_id for h in merged_hits]
            embs2 = await fetch_embeddings_for(self._session, emb_ids2)
            deduped = deduplicate_by_embedding(
                merged_hits,
                embs2,
                threshold=self._settings.retrieval_dedup_threshold,
            )
        ms_graph = (time.perf_counter() - t_graph) * 1000.0

        for h in deduped:
            h.temporal_score = compute_temporal_score(h, temporal, self._settings)
        deduped.sort(key=lambda h: -composite_retrieval_score(h, self._settings))
        rr_pool = max(
            8,
            min(48, int(self._settings.retrieval_rerank_pool_size * strategy.rerank_pool_scale)),
        )
        rerank_pool = deduped[:rr_pool]

        ranked_in = [
            RankedChunk(
                chunk_id=str(h.chunk_id),
                text=h.text,
                rule_path=h.rule_path,
                semantic_path=h.semantic_path,
                document_title=h.document_title,
                source_url=h.source_url,
                score=composite_retrieval_score(h, self._settings),
            )
            for h in rerank_pool
        ]
        t_rr = time.perf_counter()
        ranked_out = await self._reranker.rerank(question, ranked_in, top_n=max(top_k, 12))
        ms_rerank = (time.perf_counter() - t_rr) * 1000.0

        by_id = {h.chunk_id: h for h in deduped}
        final: list[ChunkHit] = []
        for r in ranked_out[:top_k]:
            base = by_id.get(UUID(r.chunk_id))
            if base is None:
                continue
            rr_n: float | None
            if self._settings.reranker_enabled:
                rs = float(r.score)
                rr_n = 1.0 / (1.0 + math.exp(-rs))
            else:
                rr_n = None
            final.append(
                ChunkHit(
                    chunk_id=base.chunk_id,
                    document_id=base.document_id,
                    text=base.text,
                    rule_path=base.rule_path,
                    semantic_path=base.semantic_path,
                    parent_chunk_id=base.parent_chunk_id,
                    hierarchy_level=base.hierarchy_level,
                    document_title=base.document_title,
                    source_url=base.source_url,
                    content_sha256=base.content_sha256,
                    version_label=base.version_label,
                    document_content_hash=base.document_content_hash,
                    metadata=dict(base.metadata),
                    vector_score=base.vector_score,
                    bm25_score=base.bm25_score,
                    fused_score=base.fused_score,
                    rerank_score=rr_n,
                    temporal_score=base.temporal_score,
                    expansion_source=base.expansion_source,
                )
            )

        def _final_sort_key(h: ChunkHit) -> tuple[float, str, str]:
            comp = -composite_retrieval_score(h, self._settings)
            if temporal.prefer_historical or temporal.as_of:
                vl = (h.version_label or "").lower()
                created = str(h.metadata.get("chunk_created_at") or "")
                return (comp, vl, created)
            return (comp, "", "")

        final.sort(key=_final_sort_key)

        if self._settings.reranker_enabled and final and final[0].rerank_score is not None:
            rs = [float(h.rerank_score or 0.0) for h in final]
            rr_mean = sum(rs) / len(rs)
            rr_top = max(rs)
        else:
            rr_mean, rr_top = None, None
        spread = score_spread_from_list([h.effective_score for h in final])
        overlap = vec_lex_agreement(vec_ids, lex_ids, k=12)
        n_sources = len({h.document_id for h in final})
        n_rule_sources = count_distinct_rule_sources(final)
        n_parents = sum(1 for h in final if h.expansion_source == "parent")
        top1_fused = max((h.fused_score for h in final), default=0.0)
        profile = get_confidence_profile(game_slug)

        sig = ConfidenceSignals(
            mean_fused=sum(h.fused_score for h in final) / len(final) if final else 0.0,
            top1_fused=top1_fused,
            mean_rerank=rr_mean,
            top1_rerank=rr_top,
            vec_lex_overlap=overlap,
            score_spread=spread,
            n_sources=n_sources,
            n_rule_sources=n_rule_sources,
            n_chunks=len(final),
            n_expansion_parents=n_parents,
        )
        conf = compute_confidence(sig, profile)

        ms_total = (time.perf_counter() - t0) * 1000.0
        temporal_mean = sum(h.temporal_score for h in final) / len(final) if final else 0.0
        temporal_sql_active = bool(t_as_of)
        graph_n = len(graph_ids)
        reasoning_path = list(
            dict.fromkeys([*strategy.reasoning_path_labels, *[f"rule_head:{h}" for h in merged_seeds[:8]]])
        )
        graph_conf = min(
            0.97,
            0.48 + 0.38 * conf + (0.08 if edge_trace else 0.0) + 0.04 * min(1.0, graph_n / max(1, eff_limit)),
        )
        reasons = build_retrieval_explanations(
            question,
            final,
            confidence=conf,
            decomposition=decomposition,
            graph_expansion_n=graph_n,
            temporal_score_mean=temporal_mean,
            routing_profile=strategy.profile_name,
            reasoning_graph_template=strategy.reasoning_graph_template,
        )
        explain = build_explainability_v2(
            base_reasons=reasons,
            reasoning_path=reasoning_path,
            graph_confidence=graph_conf,
        )
        logger.info(
            "retrieval.pipeline.done",
            n_vec=len(vec_ids),
            n_lex=len(lex_ids),
            n_seeds=len(seeds),
            n_expanded=len(expanded),
            n_dedup=len(deduped),
            n_final=len(final),
            confidence=round(conf, 4),
            intent=rh.analysis.primary.value,
            doc_types=rh.doc_types,
            temporal_prefer_historical=t_hist,
            temporal_as_of_set=bool(t_as_of),
            temporal_sql_active=temporal_sql_active,
            temporal_score_mean=round(temporal_mean, 4),
            graph_expansion_candidates=graph_n,
            graph_expansion_limit_used=eff_limit,
            decomposition_subqueries=len(decomposition.sub_queries),
            routing_profile=strategy.profile_name,
            reasoning_template=strategy.reasoning_graph_template,
            latency_ms_total=round(ms_total, 3),
            latency_ms_vector=round(ms_vec, 3),
            latency_ms_lexical=round(ms_lex, 3),
            latency_ms_fetch_rows=round(ms_fetch, 3),
            latency_ms_expand=round(ms_expand, 3),
            latency_ms_embeddings=round(ms_emb, 3),
            latency_ms_graph=round(ms_graph, 3),
            latency_ms_rerank=round(ms_rerank, 3),
        )
        return RetrievalOutcome(
            hits=final,
            confidence=conf,
            signals=sig,
            retrieval_reasons=reasons,
            decomposition=decomposition,
            graph_expansion_limit_used=eff_limit,
            graph_expansion_candidates=graph_n,
            query_id=qid,
            graph_edges_used=edge_trace,
            reasoning_path=reasoning_path,
            graph_confidence=graph_conf,
            routing_profile=strategy.profile_name,
            explainability=explain,
            debug={
                "intent": rh.analysis.primary.value,
                "query_complexity": decomposition.complexity,
                "game_slug": game_slug,
                "quality_ema": quality_ema,
            },
        )


class HybridRetriever:
    """Wrapper retrocompatível."""

    def __init__(self, session: AsyncSession, game_id: UUID, settings: Settings) -> None:
        self._session = session
        self._game_id = game_id
        self._settings = settings
        self._pipe = RetrievalPipeline(session, game_id, settings)

    async def search(
        self,
        question: str,
        *,
        top_k: int = 10,
        hint: RetrievalHint | None = None,
        temporal: TemporalHint | None = None,
        game_slug: str = "mtg",
    ) -> RetrievalOutcome:
        return await self._pipe.run(question, top_k=top_k, hint=hint, temporal=temporal, game_slug=game_slug)
