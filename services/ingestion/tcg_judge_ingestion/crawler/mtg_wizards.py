"""Descoberta de PDFs oficiais Wizards (CR, MTR, IPG) a partir do hub de regras."""

from __future__ import annotations

import hashlib
from dataclasses import dataclass
from urllib.parse import urljoin, urlparse

import httpx
import structlog
from bs4 import BeautifulSoup

logger = structlog.get_logger(__name__)

DEFAULT_RULES_HUB = "https://magic.wizards.com/en/rules"
USER_AGENT = (
    "TCGJudgeBot/0.1 (+https://github.com/tcg-judge; rules ingestion; respectful crawl)"
)

PDF_HINTS: tuple[tuple[str, str], ...] = (
    ("comprehensive", "CR"),
    ("comprehensiverules", "CR"),
    ("magic tournament rules", "MTR"),
    ("tournament rules", "MTR"),
    ("infraction procedure", "IPG"),
    ("infractionprocedure", "IPG"),
    ("release notes", "RELEASE"),
)


@dataclass(frozen=True)
class DiscoveredDocument:
    url: str
    doc_type: str
    title_hint: str


def _classify_pdf(href: str, link_text: str) -> str | None:
    h = href.lower()
    t = link_text.lower()
    blob = f"{h} {t}"
    for needle, doc_type in PDF_HINTS:
        if needle in blob:
            return doc_type
    if h.endswith(".pdf") and "magic" in blob:
        return "UNKNOWN_PDF"
    return None


async def discover_mtg_official_pdfs(
    index_url: str = DEFAULT_RULES_HUB,
    *,
    timeout: float = 60.0,
) -> list[DiscoveredDocument]:
    headers = {"User-Agent": USER_AGENT, "Accept-Language": "en-US,en;q=0.9"}
    async with httpx.AsyncClient(follow_redirects=True, headers=headers, timeout=timeout) as client:
        resp = await client.get(index_url)
        resp.raise_for_status()
        html = resp.text

    soup = BeautifulSoup(html, "html.parser")
    seen: set[str] = set()
    out: list[DiscoveredDocument] = []

    for a in soup.find_all("a", href=True):
        href = a["href"].strip()
        if not href.lower().endswith(".pdf"):
            continue
        abs_url = urljoin(index_url, href)
        if abs_url in seen:
            continue
        parsed = urlparse(abs_url)
        if parsed.scheme not in ("http", "https"):
            continue
        # Apenas domínios Wizards / Magic
        host = parsed.netloc.lower()
        if not any(x in host for x in ("wizards.com", "magic.wizards.com", "media.wizards.com")):
            continue
        text = (a.get_text() or "").strip()
        doc_type = _classify_pdf(abs_url, text)
        if doc_type is None or doc_type == "UNKNOWN_PDF":
            continue
        seen.add(abs_url)
        out.append(DiscoveredDocument(url=abs_url, doc_type=doc_type, title_hint=text or doc_type))

    logger.info("mtg.discovered", count=len(out), index_url=index_url)
    return out


def looks_like_pdf(data: bytes) -> bool:
    return len(data) >= 5 and data[:5] == b"%PDF-"


async def download_bytes(
    url: str,
    *,
    timeout: float = 120.0,
    referer: str | None = None,
    warmup_url: str | None = None,
) -> tuple[bytes, str]:
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (compatible; TCGJudgeBot/0.1; +rules-ingestion) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        ),
        "Accept": "application/pdf,text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
    }
    if referer:
        headers["Referer"] = referer
    async with httpx.AsyncClient(follow_redirects=True, headers=headers, timeout=timeout) as client:
        if warmup_url:
            try:
                await client.get(warmup_url)
            except Exception as e:
                logger.warning("download.warmup_failed", url=warmup_url, error=str(e))
        resp = await client.get(url)
        resp.raise_for_status()
        data = resp.content
    mime = resp.headers.get("content-type", "application/octet-stream").split(";")[0].strip()
    return data, mime


async def download_pdf_bytes(
    url: str,
    *,
    fallback_urls: tuple[str, ...] = (),
    timeout: float = 120.0,
    referer: str | None = None,
    warmup_url: str | None = None,
) -> tuple[bytes, str]:
    """Baixa bytes e exige cabeçalho PDF (%PDF-). Tenta fallbacks em ordem."""
    last_err: Exception | None = None
    for i, candidate in enumerate((url, *fallback_urls)):
        try:
            data, mime = await download_bytes(
                candidate,
                timeout=timeout,
                referer=referer,
                warmup_url=warmup_url if i == 0 else None,
            )
            if looks_like_pdf(data):
                return data, mime
            preview = data[:80].decode("utf-8", errors="replace")
            last_err = ValueError(
                f"Resposta não é PDF de {candidate!r} (mime={mime!r}, len={len(data)}, "
                f"preview={preview!r})"
            )
            logger.warning("download.not_pdf", url=candidate, mime=mime, size=len(data))
        except Exception as e:
            last_err = e
            logger.warning("download.failed", url=candidate, error=str(e))
    raise RuntimeError(f"Nenhum URL devolveu PDF válido (último erro: {last_err})") from last_err


def sha256_hex(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def etag_version(headers: httpx.Headers) -> str | None:
    return headers.get("etag") or headers.get("last-modified")
