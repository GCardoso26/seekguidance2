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
    if not data.startswith(b"%PDF-"):
        raise ValueError("Not a valid PDF (missing %PDF- header)")
    primary = extract_text_pymupdf(data)
    if len(primary.strip()) >= 200:
        return primary
    logger.warning("pdf.fallback_pdfplumber", reason="low_text_from_pymupdf")
    try:
        fallback = extract_text_pdfplumber_fallback(data)
        if len(fallback.strip()) >= 50:
            return fallback
    except Exception as e:
        logger.warning("pdf.pdfplumber_failed", error=str(e))
    if len(primary.strip()) > 0:
        return primary
    raise ValueError("PDF sem texto extraível (pymupdf e pdfplumber falharam)")
