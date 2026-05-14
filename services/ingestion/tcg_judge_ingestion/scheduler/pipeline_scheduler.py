"""Orquestração de jobs de ingestão (arq / Redis)."""

from __future__ import annotations

from typing import Any


def enqueue_download(redis: Any, *, url: str, doc_type: str, title: str, game_slug: str) -> None:
    redis.enqueue_job("download_worker", url, doc_type, title, game_slug)
