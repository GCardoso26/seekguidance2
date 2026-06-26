"""Validação de CPF — algoritmo local + lookup opcional."""

from __future__ import annotations

import hashlib
import os
import re

import httpx
import structlog

logger = structlog.get_logger(__name__)

CPF_RE = re.compile(r"^\d{11}$")


def normalize_cpf(value: str) -> str:
    return re.sub(r"\D", "", value or "")


def is_valid_cpf(value: str) -> bool:
    cpf = normalize_cpf(value)
    if not CPF_RE.match(cpf):
        return False
    if cpf == cpf[0] * 11:
        return False

    def digit(n: int) -> int:
        total = sum(int(cpf[i]) * (n - i) for i in range(n - 1))
        rem = (total * 10) % 11
        return 0 if rem == 10 else rem

    return digit(10) == int(cpf[9]) and digit(11) == int(cpf[10])


def hash_cpf(value: str) -> str:
    return hashlib.sha256(normalize_cpf(value).encode()).hexdigest()


def cpf_last4(value: str) -> str:
    return normalize_cpf(value)[-4:]


async def lookup_cpf_external(cpf: str) -> tuple[bool, str | None]:
    """Consulta opcional (ReceitaWS, BrasilAPI proxy, etc.) — CPF_LOOKUP_URL template."""
    url_template = os.getenv("CPF_LOOKUP_URL", "").strip()
    if not url_template:
        return True, None
    normalized = normalize_cpf(cpf)
    url = url_template.replace("{cpf}", normalized)
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            res = await client.get(url)
            if res.status_code == 404:
                return False, "CPF não encontrado na base da Receita Federal"
            if res.status_code != 200:
                logger.warning("cpf_lookup_failed", status=res.status_code)
                return True, None
            data = res.json()
            if isinstance(data, dict) and data.get("status") == "ERROR":
                return False, str(data.get("message") or "CPF inválido")
            return True, None
    except Exception as exc:
        logger.warning("cpf_lookup_error", error=str(exc))
        return True, None
