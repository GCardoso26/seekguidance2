"""
Cache semântico para o pipeline RAG do Judge TCG.

Dois providers:
- 'hash': cache por hash exato do texto normalizado (default).
  Zero dependência extra. Redis padrão. Funciona com qualquer deployment.
  Cache hit: pergunta idêntica (normalizada) já foi respondida.

- 'redis_stack': reservado para similaridade vetorial via RediSearch (upgrade opcional).
  Quando indisponível, degrada para provider 'hash'.

A chave sempre inclui o model_slug para invalidação automática
após upgrade do modelo de embedding.
"""

from __future__ import annotations

import hashlib
import json
import logging
import re
from typing import Any

logger = logging.getLogger(__name__)

_stats = {"hash_hits": 0, "hash_misses": 0}


def hash_cache_stats() -> dict[str, Any]:
    total = _stats["hash_hits"] + _stats["hash_misses"]
    rate = (_stats["hash_hits"] / total) if total else 0.0
    return {"hash_hits": _stats["hash_hits"], "hash_misses": _stats["hash_misses"], "hit_rate": round(rate, 4)}


def _normalize_question(text: str) -> str:
    """Normaliza pergunta para hash determinístico (ordem de palavras preservada)."""
    text = text.lower().strip()
    text = re.sub(r"[^\w\s]", "", text)
    return " ".join(text.split())


def _model_slug(model_name: str) -> str:
    """8 chars do hash do nome do modelo — versiona a chave."""
    return hashlib.sha256(model_name.encode()).hexdigest()[:8]


def cache_key(game_slug: str, model_name: str, text: str) -> str:
    text_hash = hashlib.sha256(_normalize_question(text).encode()).hexdigest()[:16]
    slug = _model_slug(model_name)
    return f"tcg:cache:{game_slug}:{slug}:{text_hash}"


def _redis_sync_get(client, key: str) -> str | None:
    try:
        return client.get(key)
    except Exception:
        return None


def _redis_sync_set(client, key: str, value: str, ttl: int) -> None:
    try:
        client.setex(key, ttl, value)
    except Exception:
        pass


def _redis_sync_delete_pattern(client, pattern: str) -> int:
    removed = 0
    try:
        for k in client.scan_iter(match=pattern):
            client.delete(k)
            removed += 1
    except Exception:
        pass
    return removed


async def get_cached_response(
    redis_client,
    game_slug: str,
    question: str,
    model_name: str,
    *,
    enabled: bool = True,
) -> dict[str, Any] | None:
    """
    Tenta recuperar resposta do cache hash.
    Retorna None em caso de miss ou quando Redis indisponível (degradação graciosa).
    """
    if not enabled or redis_client is None:
        return None
    try:
        key = cache_key(game_slug, model_name, question)
        raw = _redis_sync_get(redis_client, key)
        if raw:
            _stats["hash_hits"] += 1
            logger.debug("Cache hash hit: %s/%s", game_slug, key[-8:])
            return json.loads(raw)
        _stats["hash_misses"] += 1
        return None
    except Exception as exc:
        logger.warning("Cache get falhou (degradação graciosa): %s", exc)
        return None


async def set_cached_response(
    redis_client,
    game_slug: str,
    question: str,
    model_name: str,
    response: Any,
    *,
    enabled: bool = True,
    ttl_seconds: int = 86400,
) -> None:
    """Armazena resposta no cache hash. Falha silenciosamente."""
    if not enabled or redis_client is None:
        return
    try:
        key = cache_key(game_slug, model_name, question)
        _redis_sync_set(redis_client, key, json.dumps(response, ensure_ascii=False), ttl_seconds)
    except Exception as exc:
        logger.warning("Cache set falhou (degradação graciosa): %s", exc)


async def invalidate_game_cache(redis_client, game_slug: str, model_name: str) -> int:
    """
    Invalida todo o cache hash de um jogo após nova ingestão.
    Retorna o número de chaves deletadas.
    """
    if redis_client is None:
        return 0
    try:
        pattern = f"tcg:cache:{game_slug}:{_model_slug(model_name)}:*"
        removed = _redis_sync_delete_pattern(redis_client, pattern)
        if removed:
            logger.info("Cache hash invalidado: %d chaves para %s", removed, game_slug)
        return removed
    except Exception as exc:
        logger.warning("Cache invalidation falhou: %s", exc)
        return 0
