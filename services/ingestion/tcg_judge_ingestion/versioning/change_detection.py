"""Deteção de mudança entre versões indexadas."""

from __future__ import annotations

from tcg_judge_ingestion.versioning.fingerprint import document_fingerprint


def content_changed(
    *,
    old_fp: str,
    source_url: str,
    new_content_sha256: str,
    headers: dict[str, str] | None = None,
) -> bool:
    new_fp = document_fingerprint(source_url=source_url, content_sha256=new_content_sha256, headers=headers)
    return new_fp != old_fp
