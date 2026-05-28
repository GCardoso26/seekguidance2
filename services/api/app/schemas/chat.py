from uuid import UUID

from pydantic import BaseModel, Field


class GameOut(BaseModel):
    id: UUID
    slug: str
    display_name: str
    publisher: str
    enabled: bool


class ChatCitation(BaseModel):
    document_title: str
    source_url: str
    section_path: str | None = None
    rule_path: str | None = None
    version_label: str | None = None
    excerpt: str
    document_hash: str | None = None
    chunk_content_sha256: str | None = None
    retrieval_score: float | None = None
    page_number: int | None = None


class ChatRequest(BaseModel):
    game_slug: str = Field(..., examples=["mtg"])
    question: str = Field(..., min_length=1, max_length=4000)
    mode: str = Field(default="player", pattern="^(player|judge)$")
    conversation_id: UUID | None = None
    prefer_historical: bool | None = Field(
        default=None,
        description="Se true, prioriza texto indexado mais antigo e notas temporais.",
    )
    as_of: str | None = Field(
        default=None,
        description="Data ISO (YYYY-MM-DD) para futura filtragem explícita por versão.",
    )
    explain_retrieval: bool = Field(
        default=False,
        description="Se true, devolve razões legíveis do retrieval (debug / tuning).",
    )
    include_reasoning_engine: bool = Field(
        default=False,
        description="Se true, executa o motor de consistência (cadeia, conflitos, timing, validação).",
    )
    verdict_format: bool = Field(
        default=False,
        description="Se true, resposta estruturada tipo veredito (UI Judge TCG).",
    )


class ChatResponse(BaseModel):
    answer: str
    disclaimer: str
    citations: list[ChatCitation]
    confidence: float
    model: str | None = None
    retrieval_reasons: list[str] | None = Field(
        default=None,
        description="Explicabilidade do retrieval (opcional; ver explain_retrieval no pedido).",
    )
    explainability: dict[str, object] | None = Field(
        default=None,
        description="Explainability v2: retrieval_reason, reasoning_path, graph_confidence.",
    )
    reasoning_v3: dict[str, object] | None = Field(
        default=None,
        description="Explainability v3: interaction_chain, conflicts_detected, timing_analysis, validation.",
    )
    reasoning_v4: dict[str, object] | None = Field(
        default=None,
        description="Explainability v4: validated_chain, constraint_analysis, rejected_paths, propagation.",
    )
    reasoning_v5: dict[str, object] | None = Field(
        default=None,
        description="Explainability v5: symbolic_state_transition, state_legality, structured_rules, state_graph.",
    )
    reasoning_v6: dict[str, object] | None = Field(
        default=None,
        description="Explainability v6: causal_chain, semantic objects, layers, lineage, semantic_conflicts.",
    )
    reasoning_v7: dict[str, object] | None = Field(
        default=None,
        description=(
            "Explainability v7: compiled_ir, runtime_execution_order, formal_mutations, "
            "deterministic_replay_hash, sandbox events, verification_results."
        ),
    )
    reasoning_v8: dict[str, object] | None = Field(
        default=None,
        description=(
            "Explainability v8: formal_verification, differential_analysis, replay_validation, "
            "drift_detection e fuzzing_results."
        ),
    )
    reasoning_v9: dict[str, object] | None = Field(
        default=None,
        description=(
            "Explainability v9: semantic_compilation, ontology_analysis, ambiguity_detection, "
            "dependency_inference, semantic_graph e rule_evolution."
        ),
    )
    reasoning_v10: dict[str, object] | None = Field(
        default=None,
        description=(
            "Explainability v10: semantic_memory, temporal_reasoning, semantic_lineage, ontology_evolution, "
            "drift_analytics, replay_history e bifurcation_analysis."
        ),
    )
    reasoning_v11: dict[str, object] | None = Field(
        default=None,
        description=(
            "Explainability v11: distributed_state, judge_session, timeline_analysis, multiplayer_resolution, "
            "tournament_operations, persistent_memory, distributed_replay, runtime_observability."
        ),
    )
    verdict: str | None = None
    rule_applied: str | None = None
    explanation: str | None = None
    exceptions: str | None = None
    confidence_notice_threshold: float = Field(
        default=0.42,
        description="Limiar (0-1) abaixo do qual a UI mostra aviso de baixa confiança de retrieval.",
    )
