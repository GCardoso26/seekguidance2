"""Runtime AWS híbrido — stubs opcionais (sem boto3 obrigatório)."""

from __future__ import annotations

from app.runtime.aws_runtime.aws_runtime_config import aws_runtime_config_stub
from app.runtime.aws_runtime.aws_runtime_cost_controls import aws_runtime_cost_controls_stub
from app.runtime.aws_runtime.aws_runtime_failover import aws_runtime_failover_stub
from app.runtime.aws_runtime.aws_runtime_health import aws_runtime_health_stub
from app.runtime.aws_runtime.aws_runtime_observability import aws_runtime_observability_stub
from app.runtime.aws_runtime.aws_runtime_queue_alignment import aws_runtime_queue_alignment_stub
from app.runtime.aws_runtime.aws_runtime_recovery import aws_runtime_recovery_stub
from app.runtime.aws_runtime.aws_runtime_replay_sync import aws_runtime_replay_sync_stub
from app.runtime.aws_runtime.aws_runtime_scaling import aws_runtime_scaling_stub
from app.runtime.aws_runtime.aws_runtime_storage_alignment import aws_runtime_storage_alignment_stub

__all__ = [
    "aws_runtime_config_stub",
    "aws_runtime_cost_controls_stub",
    "aws_runtime_failover_stub",
    "aws_runtime_health_stub",
    "aws_runtime_observability_stub",
    "aws_runtime_queue_alignment_stub",
    "aws_runtime_recovery_stub",
    "aws_runtime_replay_sync_stub",
    "aws_runtime_scaling_stub",
    "aws_runtime_storage_alignment_stub",
]
