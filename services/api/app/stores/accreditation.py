"""Gates de credenciamento / publicação (ADR-018)."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from app.stores.cnpj import is_valid_cnpj


PAID_PLANS = frozenset({"lojista", "pro", "enterprise"})
BLOCKED_PLANS = frozenset({"free", "pending_accreditation", None, ""})


def _as_utc(value: Any) -> datetime | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=UTC)
    if isinstance(value, str):
        try:
            parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError:
            return None
        return parsed if parsed.tzinfo else parsed.replace(tzinfo=UTC)
    return None


def store_has_valid_cnpj(store: dict[str, Any]) -> bool:
    return is_valid_cnpj(str(store.get("cnpj") or ""))


def grandfather_window_open(store: dict[str, Any], *, now: datetime | None = None) -> bool:
    status = str(store.get("accreditation_status") or "")
    if status != "grandfathered":
        return False
    deadline = _as_utc(store.get("accreditation_deadline_at"))
    if deadline is None:
        return True
    current = now or datetime.now(UTC)
    return current <= deadline


def store_can_publish_offers(store: dict[str, Any], *, now: datetime | None = None) -> bool:
    """Publicação de novas ofertas / produtos ativos."""
    status = str(store.get("accreditation_status") or "approved")
    current = now or datetime.now(UTC)

    if status == "approved":
        if not store_has_valid_cnpj(store):
            return False
        plan = store.get("subscription_plan") or "pending_accreditation"
        return plan in PAID_PLANS

    if status == "grandfathered":
        if grandfather_window_open(store, now=current):
            return True
        # Prazo vencido: exige CNPJ + plano pago (vira caminho de aprovação).
        if not store_has_valid_cnpj(store):
            return False
        plan = store.get("subscription_plan") or "free"
        return plan in PAID_PLANS

    return False


def publish_block_reason(store: dict[str, Any], *, now: datetime | None = None) -> str | None:
    if store_can_publish_offers(store, now=now):
        return None
    status = str(store.get("accreditation_status") or "")
    if status in {"pending", "draft", "submitted", "under_review"}:
        return (
            "Loja ainda em credenciamento. Aguarde aprovação antes de publicar ofertas. "
            "Veja /vender"
        )
    if status == "rejected":
        return "Credenciamento recusado. Atualize os dados e reenvie a solicitação em /vender"
    if status == "grandfathered" and not grandfather_window_open(store, now=now):
        if not store_has_valid_cnpj(store):
            return (
                "Prazo de regularização encerrado. Informe um CNPJ válido e conclua o "
                "credenciamento para publicar novas ofertas."
            )
        return (
            "Prazo de regularização encerrado. Assine um plano pago (Lojista+) para "
            "continuar publicando."
        )
    if not store_has_valid_cnpj(store):
        return "CNPJ válido obrigatório para publicar ofertas (ADR-018)."
    plan = store.get("subscription_plan") or "pending_accreditation"
    if plan in BLOCKED_PLANS or plan == "free":
        return "Plano free não publica ofertas. Assine Lojista ou superior."
    return "Loja não elegível para publicar ofertas."


def require_store_can_publish(store: dict[str, Any]) -> None:
    from fastapi import HTTPException

    reason = publish_block_reason(store)
    if reason:
        raise HTTPException(403, reason)
