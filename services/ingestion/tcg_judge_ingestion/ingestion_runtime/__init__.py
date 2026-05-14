"""Orquestração de ingestão (backpressure, prioridades, recuperação)."""

from tcg_judge_ingestion.ingestion_runtime.adaptive_fetch_control import adaptive_fetch_delay
from tcg_judge_ingestion.ingestion_runtime.ingestion_backpressure import ingestion_backpressure_level
from tcg_judge_ingestion.ingestion_runtime.ingestion_diagnostics import ingestion_job_diagnostic
from tcg_judge_ingestion.ingestion_runtime.ingestion_priority_scheduler import schedule_ingestion_jobs
from tcg_judge_ingestion.ingestion_runtime.ingestion_recovery import replayable_job_stub
from tcg_judge_ingestion.ingestion_runtime.publisher_rate_limit_profiles import rate_limit_for_publisher
from tcg_judge_ingestion.ingestion_runtime.retry_circuit import circuit_state_after_failure

__all__ = [
    "adaptive_fetch_delay",
    "circuit_state_after_failure",
    "ingestion_backpressure_level",
    "ingestion_job_diagnostic",
    "rate_limit_for_publisher",
    "replayable_job_stub",
    "schedule_ingestion_jobs",
]
