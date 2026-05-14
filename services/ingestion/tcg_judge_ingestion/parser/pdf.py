"""Extração de texto de PDFs (CR/MTR) com hierarquia de páginas preservada."""

from __future__ import annotations

import io
from typing import BinaryIO

import fitz  # pymupdf
import structlog

logger = structlog.get_logger(__name__)


def extract_text_pymupdf(data: bytes) -> str:
    doc = fitz.open(stream=data, filetype="pdf")
    parts: list[str] = []
    try:
        for i, page in enumerate(doc):
            parts.append(f"\n\n--- PDF Page {i + 1} ---\n")
            parts.append(page.get_text("text") or "")
    finally:
        doc.close()
    return "".join(parts)


def extract_text_pdfplumber_fallback(data: bytes) -> str:
    import pdfplumber

    parts: list[str] = []
    with pdfplumber.open(io.BytesIO(data)) as pdf:
        for i, page in enumerate(pdf.pages):
            parts.append(f"\n\n--- PDF Page {i + 1} (pdfplumber) ---\n")
            parts.append(page.extract_text() or "")
    return "".join(parts)


def extract_pdf_text(data: bytes) -> str:
    primary = extract_text_pymupdf(data)
    if len(primary.strip()) < 200:
        logger.warning("pdf.fallback_pdfplumber", reason="low_text_from_pymupdf")
        return extract_text_pdfplumber_fallback(data)
    return primary
