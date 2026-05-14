"""Ingestão MTG e utilitários de pipeline (chunking, embeddings, workers)."""

from tcg_judge_ingestion.distributed_ingestion_aws import distributed_ingestion_aws_runtime_stub

__all__ = ["__version__", "distributed_ingestion_aws_runtime_stub"]

__version__ = "0.1.0"
