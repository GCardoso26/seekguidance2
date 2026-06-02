"""Normalização de DATABASE_URL para asyncpg (senhas com #, @, etc.)."""

from __future__ import annotations

import os
import ssl as ssl_mod
from typing import Any
from urllib.parse import parse_qs, quote, unquote, urlparse, urlunparse


def repair_unencoded_hash_in_dsn(dsn: str) -> str:
    """
    Repara URLs onde `#` na senha foi interpretado como fragmento.

    Ex.: postgresql://user:pass#word@host:5432/db
         → postgresql://user:pass%23word@host:5432/db
    """
    parsed = urlparse(dsn)
    if not parsed.fragment or "@" not in parsed.fragment:
        return dsn
    # URL normal já tem @ no netloc (user:pass@host)
    if "@" in parsed.netloc:
        return dsn
    if ":" not in parsed.netloc:
        return dsn

    frag_pw, hostpart = parsed.fragment.split("@", 1)
    host_only = hostpart.split("/", 1)[0]
    if ":" not in host_only:
        return dsn

    user, pw_prefix = parsed.netloc.rsplit(":", 1)
    password = f"{pw_prefix}#{frag_pw}"
    user_enc = quote(unquote(user), safe="")
    pass_enc = quote(unquote(password), safe="")
    path = parsed.path or ""
    query = f"?{parsed.query}" if parsed.query else ""
    return f"{parsed.scheme}://{user_enc}:{pass_enc}@{hostpart}{path}{query}"


def normalize_asyncpg_dsn(dsn: str) -> str:
    raw = dsn.strip()
    if not raw:
        return raw
    fixed = repair_unencoded_hash_in_dsn(raw)
    return fixed.replace("postgresql+asyncpg://", "postgresql://")


def asyncpg_connect_kwargs(dsn: str) -> tuple[str, dict[str, Any]]:
    """RDS/Supabase exigem TLS; asyncpg ignora ?ssl= na URL sem kwarg explícito."""
    clean = normalize_asyncpg_dsn(dsn)
    parsed = urlparse(clean)
    query = parse_qs(parsed.query, keep_blank_values=True)

    ssl_mode = os.environ.get("DATABASE_SSL", "").strip().lower()
    qs_ssl = (query.pop("ssl", [None])[0] or "").strip().lower()
    qs_sslmode = (query.pop("sslmode", [None])[0] or "").strip().lower()
    if qs_ssl in ("require", "true", "1") or qs_sslmode in ("require", "verify-ca", "verify-full"):
        ssl_mode = ssl_mode or "require"

    host = (parsed.hostname or "").lower()
    if not ssl_mode and host.endswith(".rds.amazonaws.com"):
        ssl_mode = "require"
    if not ssl_mode and (
        host.endswith(".supabase.co") or "pooler.supabase.com" in host
    ):
        ssl_mode = "require"

    url = urlunparse(parsed._replace(query=""))
    if not ssl_mode or ssl_mode in ("disable", "false", "0"):
        return url, {}

    if ssl_mode in ("verify-full", "verify_full"):
        cert = os.environ.get("DATABASE_SSL_ROOT_CERT", "").strip()
        if cert:
            return url, {"ssl": ssl_mod.create_default_context(cafile=cert)}
        return url, {"ssl": "require"}

    return url, {"ssl": "require"}
