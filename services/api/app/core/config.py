from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "TCG Judge API"
    environment: str = "development"
    log_level: str = "INFO"

    database_url: str
    redis_url: str

    official_sources_disclaimer: str = "Informações obtidas diretamente das regras oficiais publicadas pela publisher."

    default_embedding_model: str = "text-embedding-3-large"
    default_chat_model: str = "gpt-4o-mini"
    openai_embedding_dimensions: int = 1536

    openai_api_key: str | None = None
    anthropic_api_key: str | None = None
    gemini_api_key: str | None = None
    ollama_base_url: str | None = "http://localhost:11434"

    # Retrieval judge-grade
    retrieval_vector_weight: float = 0.65
    retrieval_bm25_weight: float = 0.35
    retrieval_rrf_blend: float = 0.0
    retrieval_vector_candidate_limit: int = 48
    retrieval_lexical_candidate_limit: int = 48
    retrieval_fused_pool_size: int = 72
    retrieval_diversify_seed_cap: int = 16
    retrieval_max_per_chapter: int = 4
    retrieval_max_per_document: int = 8
    retrieval_max_ancestors: int = 14
    retrieval_max_siblings_per_seed: int = 5
    retrieval_dedup_threshold: float = 0.93
    retrieval_rerank_pool_size: int = 28
    reranker_enabled: bool = False
    reranker_model: str = "BAAI/bge-reranker-large"
    reranker_batch_size: int = 8
    confidence_low_threshold: float = 0.42

    # Scoring composto (híbrido + temporal + rerank) e pesos temporais pós-fetch
    score_weight_hybrid: float = 1.0
    score_weight_temporal: float = 0.38
    score_weight_rerank: float = 0.42
    temporal_weight_version_match: float = 1.0
    temporal_weight_snapshot: float = 1.0
    temporal_historical_boost: float = 0.07

    # Expansão por grafo de regras (vizinhança + rule_graph_edges)
    graph_retrieval_extra_limit: int = 14
    graph_retrieval_score_bonus: float = 0.055
    graph_max_seed_heads: int = 14
    graph_expansion_min: int = 6
    graph_expansion_max: int = 28
    graph_edge_min_relationship_score: float | None = None
    graph_explosion_entropy_prune_threshold: float = 0.82

    # Decomposição de query → lexical extra (multi-facet)
    retrieval_decomposition_extra_lexical: bool = True
    retrieval_decomposition_subquery_cap: int = 2

    # Context assembly / token budgeting
    context_token_budget_total: int = 7000
    context_token_budget_reserved_answer: int = 900
    context_token_encoding_model: str = "cl100k_base"

    # Feedback loop / avaliação persistente
    feedback_persistence_enabled: bool = True
    feedback_reinforcement_enabled: bool = True

    # Reasoning consistency engine (bounded chains, no board simulator)
    reasoning_max_chain_depth: int = 12
    reasoning_timeout_ms: int = 800
    constraint_max_propagation_cap: int = 48

    # Multi-TCG RAG: lista separada por vírgulas, alinhada a `games.slug` no Postgres
    rag_allowed_game_slugs: str = (
        "mtg,pokemon,yugioh,onepiece,digimon,lorcana,riftbound,fab,"
        "gundam,dbfw,sorcery,vanguard,union_arena"
    )

    def rag_allowed_game_slug_set(self) -> set[str]:
        return {s.strip().lower() for s in self.rag_allowed_game_slugs.split(",") if s.strip()}

    def is_rag_enabled_for_game(self, canonical_slug: str) -> bool:
        return canonical_slug.strip().lower() in self.rag_allowed_game_slug_set()

    # --- Production maturity (ingestão, observabilidade, SLO, cache) ---
    observability_otel_enabled: bool = False
    observability_otel_endpoint: str | None = None
    observability_prometheus_enabled: bool = True
    observability_log_json: bool = True
    # OTEL / tracing (sampling 0–1; export real quando OTEL_ENABLED + endpoint)
    observability_trace_sample_rate: float = 0.1

    api_rate_limit_requests_per_minute: int = 60
    api_rate_limit_window_seconds: float = 60.0
    judge_rate_limit_requests_per_minute: int = 24
    judge_rate_limit_window_seconds: float = 60.0
    judge_rate_limit_enabled: bool = True

    ingestion_default_host_rps: float = 1.0
    ingestion_max_concurrent_downloads: int = 4
    ingestion_dlq_enabled: bool = True
    worker_dlq_redis_key_prefix: str = "tcg:dlq"

    cache_retrieval_ttl_seconds: int = 300
    cache_semantic_ttl_seconds: int = 600

    slo_retrieval_p95_ms_target: float = 800.0
    slo_reasoning_p95_ms_target: float = 1500.0
    slo_replay_determinism_min_score: float = 0.95

    # Explainability formal additive (v8–v11 apenas; desligado por defeito)
    reasoning_formal_explainability_enabled: bool = False

    # Formal correctness (SMT/SAT layer — backend opcional: stub | z3 futuro)
    formal_solver_backend: str = "stub"
    formal_solver_timeout_ms: int = 2000
    corpus_trust_floor: float = 0.35
    continuous_eval_nightly: bool = False

    # Replay integrity (HMAC opcional; sem segredo = apenas hashing interno desativado)
    replay_signing_secret: str | None = None

    # --- AWS / EKS (opcional; docker-compose local inalterado; extra="ignore" já ativo) ---
    aws_platform_enabled: bool = False
    aws_region: str | None = None
    aws_account_id: str | None = None
    eks_cluster_name: str | None = None
    eks_oidc_issuer: str | None = None
    eks_namespace_api: str = "api"
    eks_namespace_workers: str = "workers"
    eks_namespace_replay: str = "replay"
    eks_namespace_observability: str = "observability"
    eks_namespace_evaluation: str = "evaluation"
    eks_namespace_ingestion: str = "ingestion"
    s3_replay_archive_bucket: str | None = None
    s3_ontology_snapshot_bucket: str | None = None
    s3_runtime_snapshot_bucket: str | None = None
    s3_semantic_lineage_bucket: str | None = None
    s3_judge_datasets_bucket: str | None = None
    s3_ingestion_corpus_bucket: str | None = None
    s3_proof_artifacts_bucket: str | None = None
    s3_glacier_transition_days: int | None = None
    rds_proxy_enabled: bool = False
    rds_proxy_endpoint: str | None = None
    elasticache_cluster_id: str | None = None
    replay_storage_backend: str = "postgres"  # postgres | s3 | dual_write_stub
    semantic_storage_backend: str = "postgres"
    kms_key_id: str | None = None
    secrets_manager_prefix: str | None = None
    waf_web_acl_arn: str | None = None
    api_gateway_stage_url: str | None = None
    cloudfront_distribution_id: str | None = None
    cloudwatch_log_group_api: str | None = None
    aws_xray_enabled: bool = False
    prometheus_remote_write_url: str | None = None
    grafana_workspace_url: str | None = None
    otel_resource_attributes: str | None = None
    solver_runtime_gpu_enabled: bool = False
    solver_runtime_worker_affinity: str | None = None
    worker_runtime_queue_name: str | None = None
    worker_runtime_dlq_sqs_url: str | None = None
    ingestion_aws_massive_enabled: bool = False
    ingestion_checkpoint_s3_prefix: str | None = None
    cost_governance_monthly_budget_usd: float | None = None
    branch_entropy_emergency_cap: float | None = None


@lru_cache
def get_settings() -> Settings:
    return Settings()
