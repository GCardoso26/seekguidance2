"""Orquestração MTG — delega para pipeline genérico."""

from __future__ import annotations

from tcg_judge_ingestion.pipeline.tcg_ingest import ingest_pdf_url

__all__ = ["ingest_pdf_url"]
