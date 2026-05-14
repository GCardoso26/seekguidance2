"""Solver formal v6 — runtime AWS distribuído (opcional; bounded; sem CNF bruto)."""

from __future__ import annotations

from typing import Any

from app.core.config import get_settings
from app.verification.formal_solver_v6._payloads import _v6_payload


def aws_solver_runtime_v6_payload(job_id: str) -> dict[str, Any]:
    s = get_settings()
    return _v6_payload(
        legality_reasoning=[f"Job «{job_id}» em modo AWS stub (workers bounded)."],
        proof_steps=[{"step": 1, "action": "schedule_worker", "gpu": s.solver_runtime_gpu_enabled}],
        assistant_notes=[
            "GPU opcional via SOLVER_RUNTIME_GPU_ENABLED e afinidade de nó.",
            "Proof artifacts podem persistir em S3 quando S3_PROOF_ARTIFACTS_BUCKET definido.",
        ],
        replay_legality_summary="Ligação replay↔solver permanece auditável.",
        solver_confidence=0.82,
        legality_certificates=["aws_runtime_stub"],
    )
