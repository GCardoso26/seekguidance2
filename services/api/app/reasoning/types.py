"""Tipos partilhados do motor de consistência de raciocínio (gameplay, não emulador)."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Literal

ConflictSeverity = Literal["low", "medium", "high"]


@dataclass
class ConflictItem:
    type: str
    rules: list[str]
    severity: ConflictSeverity
    resolution_strategy: str
    notes: str = ""


@dataclass
class ExecutionStep:
    """Passo de execução; `role` alinha-se a constraint_rules / reasoning_rules."""

    step_id: str
    description: str
    depends_on: tuple[str, ...] = ()
    role: str | None = None


@dataclass
class StateSnapshot:
    label: str
    notes: str = ""


@dataclass
class SimulationTrace:
    before_state: StateSnapshot
    steps: list[str] = field(default_factory=list)
    after_state: StateSnapshot = field(default_factory=lambda: StateSnapshot("resolved"))


@dataclass
class ValidationReport:
    reasoning_valid: bool
    ambiguity_level: float
    unsupported_steps: list[str]
    reasoning_confidence: float


@dataclass
class ConstraintResolutionV4:
    """Saída determinística + constraints (explainability v4)."""

    validated_chain: list[str]
    constraint_analysis: dict[str, Any]
    rejected_paths: list[dict[str, Any]]
    deterministic_confidence: float
    propagation_chain: list[str]
    contradictions: list[dict[str, Any]]
    valid_chain: bool
    constraint_violations: list[dict[str, Any]]
    validation_score: float

    def to_api_dict(self) -> dict[str, Any]:
        return {
            "validated_chain": self.validated_chain,
            "constraint_analysis": self.constraint_analysis,
            "rejected_paths": self.rejected_paths,
            "deterministic_confidence": round(self.deterministic_confidence, 4),
            "propagation_chain": self.propagation_chain,
            "contradictions": self.contradictions,
            "valid_chain": self.valid_chain,
            "constraint_violations": self.constraint_violations,
            "validation_score": round(self.validation_score, 4),
        }


@dataclass
class SymbolicStateResolutionV5:
    """Explainability v5: transições de estado simbólicas + regras estruturadas."""

    symbolic_state_transition: list[dict[str, str]]
    invalid_paths_rejected: list[dict[str, str]]
    converged_paths: int
    state_legality: bool
    deterministic_confidence: float
    structured_rules: list[dict[str, Any]]
    branch_stats: dict[str, Any]
    state_graph: dict[str, Any]
    final_legality: dict[str, Any]

    def to_api_dict(self) -> dict[str, Any]:
        return {
            "symbolic_state_transition": self.symbolic_state_transition,
            "invalid_paths_rejected": self.invalid_paths_rejected,
            "converged_paths": self.converged_paths,
            "state_legality": self.state_legality,
            "deterministic_confidence": round(self.deterministic_confidence, 4),
            "structured_rules": self.structured_rules,
            "branch_stats": self.branch_stats,
            "state_graph": self.state_graph,
            "final_legality": self.final_legality,
        }


@dataclass
class SemanticGameplayResolutionV6:
    """Explainability v6: objetos semânticos, causalidade, layers, equivalência profunda."""

    causal_chain: list[dict[str, Any]]
    semantic_state_changes: list[dict[str, Any]]
    continuous_effects_applied: list[str]
    layer_ordering: list[str]
    equivalent_paths_merged: int
    object_lineage: list[dict[str, str]]
    deterministic_confidence: float
    event_trace: list[str]
    snapshots_n: int
    semantic_conflicts: list[dict[str, Any]]

    def to_api_dict(self) -> dict[str, Any]:
        return {
            "causal_chain": self.causal_chain,
            "semantic_state_changes": self.semantic_state_changes,
            "continuous_effects_applied": self.continuous_effects_applied,
            "layer_ordering": self.layer_ordering,
            "equivalent_paths_merged": self.equivalent_paths_merged,
            "object_lineage": self.object_lineage,
            "deterministic_confidence": round(self.deterministic_confidence, 4),
            "event_trace": self.event_trace,
            "snapshots_recorded": self.snapshots_n,
            "semantic_conflicts": self.semantic_conflicts,
        }


@dataclass
class FormalRuntimeResolutionV7:
    """Explainability v7: IR compilado, runtime determinístico, mutações formais, sandbox."""

    compiled_ir: list[dict[str, Any]]
    runtime_execution_order: list[str]
    formal_mutations: list[dict[str, Any]]
    state_invariants_checked: list[str]
    deterministic_replay_hash: str
    runtime_constraints_applied: list[str]
    semantic_compositions: list[dict[str, Any]]
    execution_sandbox_events: list[dict[str, Any]]
    verification_results: list[dict[str, Any]]
    runtime_convergence_score: float

    def to_api_dict(self) -> dict[str, Any]:
        return {
            "compiled_ir": self.compiled_ir,
            "runtime_execution_order": self.runtime_execution_order,
            "formal_mutations": self.formal_mutations,
            "state_invariants_checked": self.state_invariants_checked,
            "deterministic_replay_hash": self.deterministic_replay_hash,
            "runtime_constraints_applied": self.runtime_constraints_applied,
            "semantic_compositions": self.semantic_compositions,
            "execution_sandbox_events": self.execution_sandbox_events,
            "verification_results": self.verification_results,
            "runtime_convergence_score": round(self.runtime_convergence_score, 4),
        }


@dataclass
class FormalTrustworthinessResolutionV8:
    """Explainability v8: verificação formal, differential, replay e drift."""

    formal_verification: dict[str, Any]
    differential_analysis: dict[str, Any]
    replay_validation: dict[str, Any]
    drift_detection: dict[str, Any]
    fuzzing_results: dict[str, Any]

    def to_api_dict(self) -> dict[str, Any]:
        return {
            "formal_verification": self.formal_verification,
            "differential_analysis": self.differential_analysis,
            "replay_validation": self.replay_validation,
            "drift_detection": self.drift_detection,
            "fuzzing_results": self.fuzzing_results,
        }


@dataclass
class SemanticRuleIntelligenceV9:
    """Explainability v9: semantic compiler, ontology, ambiguity e evolução."""

    semantic_compilation: dict[str, Any]
    ontology_analysis: dict[str, Any]
    ambiguity_detection: dict[str, Any]
    dependency_inference: dict[str, Any]
    semantic_graph: dict[str, Any]
    rule_evolution: dict[str, Any]

    def to_api_dict(self) -> dict[str, Any]:
        return {
            "semantic_compilation": self.semantic_compilation,
            "ontology_analysis": self.ontology_analysis,
            "ambiguity_detection": self.ambiguity_detection,
            "dependency_inference": self.dependency_inference,
            "semantic_graph": self.semantic_graph,
            "rule_evolution": self.rule_evolution,
        }


@dataclass
class TemporalSemanticIntelligenceV10:
    """Explainability v10: memória semântica temporal e evolução histórica."""

    semantic_memory: dict[str, Any]
    temporal_reasoning: dict[str, Any]
    semantic_lineage: dict[str, Any]
    ontology_evolution: dict[str, Any]
    drift_analytics: dict[str, Any]
    replay_history: dict[str, Any]
    bifurcation_analysis: dict[str, Any]

    def to_api_dict(self) -> dict[str, Any]:
        return {
            "semantic_memory": self.semantic_memory,
            "temporal_reasoning": self.temporal_reasoning,
            "semantic_lineage": self.semantic_lineage,
            "ontology_evolution": self.ontology_evolution,
            "drift_analytics": self.drift_analytics,
            "replay_history": self.replay_history,
            "bifurcation_analysis": self.bifurcation_analysis,
        }


@dataclass
class DistributedJudgeRuntimeV11:
    """Explainability v11: estado distribuído, sessão de juiz, timeline e replay (TCG, não jurídico)."""

    distributed_state: dict[str, Any]
    judge_session: dict[str, Any]
    timeline_analysis: dict[str, Any]
    multiplayer_resolution: dict[str, Any]
    tournament_operations: dict[str, Any]
    persistent_memory: dict[str, Any]
    distributed_replay: dict[str, Any]
    runtime_observability: dict[str, Any]

    def to_api_dict(self) -> dict[str, Any]:
        return {
            "distributed_state": self.distributed_state,
            "judge_session": self.judge_session,
            "timeline_analysis": self.timeline_analysis,
            "multiplayer_resolution": self.multiplayer_resolution,
            "tournament_operations": self.tournament_operations,
            "persistent_memory": self.persistent_memory,
            "distributed_replay": self.distributed_replay,
            "runtime_observability": self.runtime_observability,
        }


@dataclass
class ReasoningReportV3:
    interaction_chain: list[str]
    conflicts_detected: list[ConflictItem]
    reasoning_confidence: float
    timing_analysis: dict[str, Any]
    validation: ValidationReport
    simulation: SimulationTrace
    metadata: dict[str, Any] = field(default_factory=dict)
    constraint_resolution: ConstraintResolutionV4 | None = None
    symbolic_resolution_v5: SymbolicStateResolutionV5 | None = None
    semantic_resolution_v6: SemanticGameplayResolutionV6 | None = None
    formal_runtime_resolution_v7: FormalRuntimeResolutionV7 | None = None
    formal_trustworthiness_v8: FormalTrustworthinessResolutionV8 | None = None
    semantic_rule_intelligence_v9: SemanticRuleIntelligenceV9 | None = None
    temporal_semantic_intelligence_v10: TemporalSemanticIntelligenceV10 | None = None
    distributed_judge_runtime_v11: DistributedJudgeRuntimeV11 | None = None

    def to_api_dict(self) -> dict[str, Any]:
        return {
            "interaction_chain": self.interaction_chain,
            "conflicts_detected": [
                {
                    "type": c.type,
                    "rules": c.rules,
                    "severity": c.severity,
                    "resolution_strategy": c.resolution_strategy,
                    "notes": c.notes,
                }
                for c in self.conflicts_detected
            ],
            "reasoning_confidence": round(self.reasoning_confidence, 4),
            "timing_analysis": self.timing_analysis,
            "validation": {
                "reasoning_valid": self.validation.reasoning_valid,
                "ambiguity_level": round(self.validation.ambiguity_level, 4),
                "unsupported_steps": self.validation.unsupported_steps,
                "reasoning_confidence": round(self.validation.reasoning_confidence, 4),
            },
            "simulation": {
                "before_state": {
                    "label": self.simulation.before_state.label,
                    "notes": self.simulation.before_state.notes,
                },
                "steps": self.simulation.steps,
                "after_state": {
                    "label": self.simulation.after_state.label,
                    "notes": self.simulation.after_state.notes,
                },
            },
            "metadata": self.metadata,
            "constraint_resolution": (
                self.constraint_resolution.to_api_dict() if self.constraint_resolution is not None else None
            ),
            "reasoning_v5": (
                self.symbolic_resolution_v5.to_api_dict() if self.symbolic_resolution_v5 is not None else None
            ),
            "reasoning_v6": (
                self.semantic_resolution_v6.to_api_dict() if self.semantic_resolution_v6 is not None else None
            ),
            "reasoning_v7": (
                self.formal_runtime_resolution_v7.to_api_dict()
                if self.formal_runtime_resolution_v7 is not None
                else None
            ),
            "reasoning_v8": (
                self.formal_trustworthiness_v8.to_api_dict()
                if self.formal_trustworthiness_v8 is not None
                else None
            ),
            "reasoning_v9": (
                self.semantic_rule_intelligence_v9.to_api_dict()
                if self.semantic_rule_intelligence_v9 is not None
                else None
            ),
            "reasoning_v10": (
                self.temporal_semantic_intelligence_v10.to_api_dict()
                if self.temporal_semantic_intelligence_v10 is not None
                else None
            ),
        }

