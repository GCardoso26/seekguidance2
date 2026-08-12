"""CRUD de pedidos de credenciamento (Fase 2 / ADR-018)."""

from __future__ import annotations

import json
from typing import Any, NoReturn

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.kyc.cpf import is_valid_cpf, normalize_cpf
from app.stores.cnpj import format_cnpj, is_valid_cnpj, only_digits, require_valid_cnpj


def _http_error(status: int, detail: str) -> NoReturn:
    from fastapi import HTTPException

    raise HTTPException(status, detail)


OPEN_STATUSES = frozenset({"draft", "submitted", "under_review"})
REVIEW_CHECKLIST = [
    {"id": "company", "label": "Dados da empresa", "done_from": "submitted"},
    {"id": "identity", "label": "Identidade do responsável", "done_from": "submitted"},
    {"id": "store_profile", "label": "Informações da loja", "done_from": "submitted"},
    {"id": "commercial", "label": "Perfil comercial", "done_from": "submitted"},
    {"id": "analysis", "label": "Análise JudgeTCG", "done_from": "under_review"},
    {"id": "approval", "label": "Aprovação", "done_from": "approved"},
    {"id": "catalog", "label": "Configuração do catálogo", "done_from": "approved"},
    {"id": "first_offer", "label": "Primeira oferta", "done_from": "approved"},
]


def _serialize(row: dict[str, Any]) -> dict[str, Any]:
    status = str(row.get("status") or "draft")
    return {
        **row,
        "answers": row.get("answers") or {},
        "checklist": _checklist_for_status(status),
        "is_open": status in OPEN_STATUSES,
        "awaiting_review": status in {"submitted", "under_review"},
    }


def _checklist_for_status(status: str) -> list[dict[str, Any]]:
    order = ["draft", "submitted", "under_review", "approved", "rejected"]
    try:
        idx = order.index(status)
    except ValueError:
        idx = 0

    def done(done_from: str) -> bool:
        if status == "rejected":
            return done_from in {"submitted"}
        try:
            return idx >= order.index(done_from)
        except ValueError:
            return False

    items: list[dict[str, Any]] = []
    for item in REVIEW_CHECKLIST:
        is_done = done(item["done_from"])
        if item["id"] in {"catalog", "first_offer"} and status == "approved":
            is_done = False
        state = "done" if is_done else "pending"
        if status == "submitted" and item["id"] == "analysis":
            state = "current"
        elif status == "under_review" and item["id"] == "analysis":
            state = "current"
        elif status == "approved" and item["id"] == "catalog":
            state = "current"
        items.append({**item, "state": state})
    return items


def compute_trust_score(answers: dict[str, Any]) -> int:
    score = 20
    store = answers.get("store") or {}
    evidence = answers.get("evidence") or {}
    ops = answers.get("operations") or {}
    profile = answers.get("profile") or {}

    if answers.get("cnpj_confirmed"):
        score += 25
    if store.get("site") or evidence.get("site"):
        score += 10
    if store.get("instagram") or evidence.get("instagram"):
        score += 8
    if evidence.get("google_business"):
        score += 8
    if evidence.get("marketplace"):
        score += 6
    photos = evidence.get("photos") or []
    if isinstance(photos, list) and photos:
        score += min(12, 4 * len(photos))
    if evidence.get("document_url"):
        score += 6
    tcgs = profile.get("tcgs") or []
    if isinstance(tcgs, list) and tcgs:
        score += min(10, 2 * len(tcgs))
    if ops.get("stock_integrated") is True:
        score += 5
    if ops.get("sync_method") in {"api", "csv", "erp"}:
        score += 5
    return max(0, min(100, score))


def _validate_submit(answers: dict[str, Any]) -> str:
    store = answers.get("store") or {}
    responsible = answers.get("responsible") or {}
    profile = answers.get("profile") or {}
    evidence = answers.get("evidence") or {}
    ops = answers.get("operations") or {}
    agreements = answers.get("agreements") or {}

    name = str(store.get("name") or "").strip()
    if len(name) < 3:
        _http_error(400, "Informe o nome comercial da loja")
    try:
        cnpj = require_valid_cnpj(str(store.get("cnpj") or answers.get("cnpj") or ""))
    except ValueError:
        _http_error(400, "CNPJ inválido")
    if not answers.get("cnpj_confirmed"):
        _http_error(400, "Confirme os dados da empresa encontrados no CNPJ")

    if not str(responsible.get("full_name") or "").strip():
        _http_error(400, "Informe o nome do responsável")
    if not is_valid_cpf(str(responsible.get("cpf") or "")):
        _http_error(400, "CPF do responsável inválido")
    if "@" not in str(responsible.get("email") or ""):
        _http_error(400, "E-mail profissional inválido")
    if not str(responsible.get("relation") or "").strip():
        _http_error(400, "Informe a relação com a loja")

    if not (profile.get("tcgs") or []):
        _http_error(400, "Selecione ao menos um TCG")
    if not (profile.get("categories") or []):
        _http_error(400, "Selecione ao menos uma categoria de produto")

    has_evidence = any(
        [
            evidence.get("site"),
            evidence.get("instagram"),
            evidence.get("google_business"),
            evidence.get("marketplace"),
            evidence.get("document_url"),
            bool(evidence.get("photos")),
            store.get("site"),
            store.get("instagram"),
        ]
    )
    if not has_evidence:
        _http_error(400, "Informe ao menos uma evidência comercial")

    if not ops.get("sku_band") or not ops.get("orders_band") or not ops.get("sync_method"):
        _http_error(400, "Complete as informações de operação")

    required_flags = [
        "stock_updated",
        "real_prices",
        "ship_as_listed",
        "condition_policy",
        "cancel_return_policy",
        "keep_data_updated",
    ]
    if not all(bool(agreements.get(k)) for k in required_flags):
        _http_error(400, "Aceite todas as regras comerciais antes de enviar")

    return cnpj


async def get_mine(session: AsyncSession, user_id: str) -> dict[str, Any] | None:
    row = (
        await session.execute(
            text(
                """
                SELECT *
                FROM tcg_judge.store_accreditation_applications
                WHERE applicant_user_id = :uid
                ORDER BY
                  CASE status
                    WHEN 'draft' THEN 0
                    WHEN 'submitted' THEN 1
                    WHEN 'under_review' THEN 1
                    WHEN 'approved' THEN 2
                    ELSE 3
                  END,
                  updated_at DESC
                LIMIT 1
                """
            ),
            {"uid": user_id},
        )
    ).mappings().first()
    return _serialize(dict(row)) if row else None


async def get_by_id(session: AsyncSession, app_id: str, user_id: str) -> dict[str, Any]:
    row = (
        await session.execute(
            text(
                """
                SELECT * FROM tcg_judge.store_accreditation_applications
                WHERE id = :id AND applicant_user_id = :uid
                """
            ),
            {"id": app_id, "uid": user_id},
        )
    ).mappings().first()
    if not row:
        _http_error(404, "Solicitação não encontrada")
    return _serialize(dict(row))


async def create_draft(session: AsyncSession, user_id: str) -> dict[str, Any]:
    existing = await get_mine(session, user_id)
    if existing and existing.get("status") in OPEN_STATUSES:
        return existing

    try:
        row = (
            await session.execute(
                text(
                    """
                    INSERT INTO tcg_judge.store_accreditation_applications (
                      applicant_user_id, status, answers, current_step
                    ) VALUES (:uid, 'draft', '{}'::jsonb, 1)
                    RETURNING *
                    """
                ),
                {"uid": user_id},
            )
        ).mappings().first()
        await session.commit()
    except Exception:
        await session.rollback()
        existing = await get_mine(session, user_id)
        if existing and existing.get("status") in OPEN_STATUSES:
            return existing
        raise
    return _serialize(dict(row) if row else {})


async def update_draft(
    session: AsyncSession,
    app_id: str,
    user_id: str,
    *,
    answers: dict[str, Any] | None = None,
    current_step: int | None = None,
) -> dict[str, Any]:
    current = await get_by_id(session, app_id, user_id)
    if current["status"] != "draft":
        _http_error(400, "Só é possível editar solicitações em rascunho")

    merged = dict(current.get("answers") or {})
    if answers:
        for key, value in answers.items():
            if isinstance(value, dict) and isinstance(merged.get(key), dict):
                merged[key] = {**merged[key], **value}
            else:
                merged[key] = value

    store = merged.get("store") or {}
    cnpj_fmt = None
    raw_cnpj = store.get("cnpj") or merged.get("cnpj")
    if raw_cnpj and is_valid_cnpj(str(raw_cnpj)):
        cnpj_fmt = format_cnpj(only_digits(str(raw_cnpj)))
        store = {**store, "cnpj": cnpj_fmt}
        merged["store"] = store
        merged["cnpj"] = cnpj_fmt

    responsible = merged.get("responsible") or {}
    if responsible.get("cpf"):
        cpf = normalize_cpf(str(responsible["cpf"]))
        if not is_valid_cpf(cpf):
            _http_error(400, "CPF do responsável inválido")
        merged["responsible"] = {**responsible, "cpf": cpf}

    trust = compute_trust_score(merged)
    step = current_step if current_step is not None else int(current.get("current_step") or 1)
    step = max(1, min(8, step))

    row = (
        await session.execute(
            text(
                """
                UPDATE tcg_judge.store_accreditation_applications
                SET answers = CAST(:answers AS jsonb),
                    cnpj = COALESCE(:cnpj, cnpj),
                    current_step = :step,
                    trust_score_initial = :trust,
                    updated_at = NOW()
                WHERE id = :id AND applicant_user_id = :uid
                RETURNING *
                """
            ),
            {
                "answers": json.dumps(merged),
                "cnpj": cnpj_fmt,
                "step": step,
                "trust": trust,
                "id": app_id,
                "uid": user_id,
            },
        )
    ).mappings().first()
    await session.commit()
    return _serialize(dict(row) if row else {})


async def submit(session: AsyncSession, app_id: str, user_id: str) -> dict[str, Any]:
    current = await get_by_id(session, app_id, user_id)
    if current["status"] != "draft":
        _http_error(400, "Solicitação já enviada")

    answers = dict(current.get("answers") or {})
    cnpj = _validate_submit(answers)
    answers["cnpj"] = cnpj
    if "store" in answers:
        answers["store"] = {**(answers.get("store") or {}), "cnpj": cnpj}
    trust = compute_trust_score(answers)

    row = (
        await session.execute(
            text(
                """
                UPDATE tcg_judge.store_accreditation_applications
                SET status = 'submitted',
                    protocol = '#JTCG-' || lpad(
                      nextval('tcg_judge.store_accreditation_protocol_seq')::text, 6, '0'
                    ),
                    answers = CAST(:answers AS jsonb),
                    cnpj = :cnpj,
                    trust_score_initial = :trust,
                    current_step = 8,
                    submitted_at = NOW(),
                    updated_at = NOW()
                WHERE id = :id AND applicant_user_id = :uid AND status = 'draft'
                RETURNING *
                """
            ),
            {
                "answers": json.dumps(answers),
                "cnpj": cnpj,
                "trust": trust,
                "id": app_id,
                "uid": user_id,
            },
        )
    ).mappings().first()
    if not row:
        _http_error(409, "Não foi possível enviar a solicitação")
    await session.commit()
    return _serialize(dict(row))


def _slugify(name: str) -> str:
    import re
    import unicodedata

    nfkd = unicodedata.normalize("NFKD", name)
    ascii_name = "".join(c for c in nfkd if not unicodedata.combining(c))
    slug = re.sub(r"[^a-z0-9]+", "-", ascii_name.lower()).strip("-")
    if len(slug) < 3:
        slug = f"loja-{slug}" if slug else "loja-tcg"
    return slug[:50]


async def _get_by_id_admin(session: AsyncSession, app_id: str) -> dict[str, Any]:
    row = (
        await session.execute(
            text("SELECT * FROM tcg_judge.store_accreditation_applications WHERE id = :id"),
            {"id": app_id},
        )
    ).mappings().first()
    if not row:
        _http_error(404, "Solicitação não encontrada")
    return _serialize(dict(row))


async def list_queue(
    session: AsyncSession,
    *,
    status: str | None = None,
    limit: int = 50,
) -> list[dict[str, Any]]:
    clauses = ["1=1"]
    params: dict[str, Any] = {"lim": min(limit, 100)}
    if status:
        clauses.append("status = :st")
        params["st"] = status
    else:
        clauses.append("status IN ('submitted', 'under_review')")
    rows = (
        await session.execute(
            text(
                f"""
                SELECT * FROM tcg_judge.store_accreditation_applications
                WHERE {' AND '.join(clauses)}
                ORDER BY submitted_at ASC NULLS LAST, created_at ASC
                LIMIT :lim
                """
            ),
            params,
        )
    ).mappings().all()
    return [_serialize(dict(r)) for r in rows]


async def mark_under_review(session: AsyncSession, app_id: str, admin_id: str) -> dict[str, Any]:
    _ = admin_id
    current = await _get_by_id_admin(session, app_id)
    if current["status"] not in {"submitted", "under_review"}:
        _http_error(400, "Só solicitações enviadas entram em análise")
    row = (
        await session.execute(
            text(
                """
                UPDATE tcg_judge.store_accreditation_applications
                SET status = 'under_review', updated_at = NOW()
                WHERE id = :id AND status IN ('submitted', 'under_review')
                RETURNING *
                """
            ),
            {"id": app_id},
        )
    ).mappings().first()
    if not row:
        _http_error(409, "Falha ao atualizar status")
    await session.commit()
    return _serialize(dict(row))


async def reject(
    session: AsyncSession,
    app_id: str,
    admin_id: str,
    *,
    reason: str | None = None,
) -> dict[str, Any]:
    _ = admin_id
    current = await _get_by_id_admin(session, app_id)
    if current["status"] not in {"submitted", "under_review"}:
        _http_error(400, "Solicitação não está em fila de análise")
    row = (
        await session.execute(
            text(
                """
                UPDATE tcg_judge.store_accreditation_applications
                SET status = 'rejected',
                    rejection_reason = :reason,
                    reviewed_at = NOW(),
                    updated_at = NOW()
                WHERE id = :id
                RETURNING *
                """
            ),
            {"id": app_id, "reason": (reason or "").strip() or None},
        )
    ).mappings().first()
    await session.commit()
    return _serialize(dict(row) if row else {})


async def _ensure_owner_role(session: AsyncSession, store_id: str, user_id: str, display_name: str | None) -> None:
    await session.execute(
        text(
            """
            INSERT INTO tcg_judge.store_user_roles (
              store_id, user_id, role, display_name, is_active
            ) VALUES (
              :sid, :uid, 'store_owner', :name, true
            )
            ON CONFLICT (store_id, user_id) DO UPDATE
              SET role = 'store_owner',
                  is_active = true,
                  display_name = COALESCE(EXCLUDED.display_name, store_user_roles.display_name),
                  updated_at = NOW()
            """
        ),
        {"sid": store_id, "uid": user_id, "name": display_name},
    )


async def _provision_or_activate_store(
    session: AsyncSession,
    *,
    applicant_user_id: str,
    answers: dict[str, Any],
    cnpj: str,
    existing_store_id: str | None,
) -> dict[str, Any]:
    from app.players.store import ensure_player_profile
    from app.stores.cnpj import require_valid_cnpj

    store_ans = answers.get("store") or {}
    responsible = answers.get("responsible") or {}
    name = str(store_ans.get("name") or "").strip() or "Hobby Store"
    email = str(responsible.get("email") or store_ans.get("email") or f"{applicant_user_id}@judgetcg.local")
    city = store_ans.get("city")
    state = store_ans.get("state")
    website = store_ans.get("site")
    phone = store_ans.get("whatsapp") or responsible.get("phone")
    cnpj_fmt = require_valid_cnpj(cnpj)
    display = str(responsible.get("full_name") or "").strip() or None

    await ensure_player_profile(session, applicant_user_id)

    if existing_store_id:
        row = (
            await session.execute(
                text(
                    """
                    UPDATE tcg_judge.stores SET
                      name = COALESCE(:name, name),
                      cnpj = :cnpj,
                      email = COALESCE(:email, email),
                      city = COALESCE(:city, city),
                      state = COALESCE(:state, state),
                      website = COALESCE(:website, website),
                      phone = COALESCE(:phone, phone),
                      accreditation_status = 'approved',
                      accreditation_deadline_at = NULL,
                      verification_status = 'verified',
                      verified_at = NOW(),
                      trust_tier = 'verified',
                      subscription_plan = CASE
                        WHEN subscription_plan IN ('pending_accreditation', 'free') THEN 'lojista'
                        ELSE subscription_plan
                      END,
                      updated_at = NOW()
                    WHERE id = :id
                    RETURNING *
                    """
                ),
                {
                    "id": existing_store_id,
                    "name": name,
                    "cnpj": cnpj_fmt,
                    "email": email,
                    "city": city,
                    "state": state,
                    "website": website,
                    "phone": phone,
                },
            )
        ).mappings().first()
        if not row:
            _http_error(404, "Loja vinculada não encontrada")
        await _ensure_owner_role(session, str(row["id"]), applicant_user_id, display)
        return dict(row)

    # Reuse store already owned by applicant (same CNPJ or any owned store)
    existing = (
        await session.execute(
            text(
                """
                SELECT * FROM tcg_judge.stores
                WHERE owner_id = :oid
                ORDER BY
                  CASE
                    WHEN regexp_replace(COALESCE(cnpj, ''), '[^0-9]', '', 'g')
                         = regexp_replace(:cnpj, '[^0-9]', '', 'g') THEN 0
                    ELSE 1
                  END,
                  created_at ASC
                LIMIT 1
                """
            ),
            {"oid": applicant_user_id, "cnpj": cnpj_fmt},
        )
    ).mappings().first()
    if existing:
        return await _provision_or_activate_store(
            session,
            applicant_user_id=applicant_user_id,
            answers=answers,
            cnpj=cnpj_fmt,
            existing_store_id=str(existing["id"]),
        )

    foreign = (
        await session.execute(
            text(
                """
                SELECT id FROM tcg_judge.stores
                WHERE regexp_replace(COALESCE(cnpj, ''), '[^0-9]', '', 'g')
                    = regexp_replace(:cnpj, '[^0-9]', '', 'g')
                  AND owner_id <> :oid
                LIMIT 1
                """
            ),
            {"cnpj": cnpj_fmt, "oid": applicant_user_id},
        )
    ).mappings().first()
    if foreign:
        _http_error(409, "CNPJ já vinculado a outra loja na plataforma")

    base_slug = _slugify(name)
    slug = base_slug
    for i in range(0, 20):
        candidate = base_slug if i == 0 else f"{base_slug[:40]}-{i + 1}"
        taken = (
            await session.execute(
                text("SELECT 1 FROM tcg_judge.stores WHERE LOWER(slug) = LOWER(:s)"),
                {"s": candidate},
            )
        ).first()
        if not taken:
            slug = candidate
            break

    row = (
        await session.execute(
            text(
                """
                INSERT INTO tcg_judge.stores (
                  owner_id, name, slug, description, email, city, state, country,
                  website, phone, cnpj,
                  subscription_plan, accreditation_status, verification_status,
                  verified_at, trust_tier, shop_enabled
                ) VALUES (
                  :oid, :name, :slug, :desc, :email, :city, :state, 'BR',
                  :website, :phone, :cnpj,
                  'lojista', 'approved', 'verified',
                  NOW(), 'verified', true
                )
                RETURNING *
                """
            ),
            {
                "oid": applicant_user_id,
                "name": name,
                "slug": slug,
                "desc": f"Hobby store credenciada — {name}",
                "email": email,
                "city": city,
                "state": state,
                "website": website,
                "phone": phone,
                "cnpj": cnpj_fmt,
            },
        )
    ).mappings().first()
    if not row:
        _http_error(500, "Falha ao provisionar loja")
    await _ensure_owner_role(session, str(row["id"]), applicant_user_id, display)
    return dict(row)


async def approve(session: AsyncSession, app_id: str, admin_id: str) -> dict[str, Any]:
    _ = admin_id
    current = await _get_by_id_admin(session, app_id)
    if current["status"] not in {"submitted", "under_review"}:
        _http_error(400, "Solicitação não está pronta para aprovação")

    answers = dict(current.get("answers") or {})
    cnpj = str(current.get("cnpj") or (answers.get("store") or {}).get("cnpj") or "")
    store = await _provision_or_activate_store(
        session,
        applicant_user_id=str(current["applicant_user_id"]),
        answers=answers,
        cnpj=cnpj,
        existing_store_id=str(current["store_id"]) if current.get("store_id") else None,
    )

    row = (
        await session.execute(
            text(
                """
                UPDATE tcg_judge.store_accreditation_applications
                SET status = 'approved',
                    store_id = :sid,
                    reviewed_at = NOW(),
                    updated_at = NOW()
                WHERE id = :id
                RETURNING *
                """
            ),
            {"id": app_id, "sid": store["id"]},
        )
    ).mappings().first()
    await session.commit()
    payload = _serialize(dict(row) if row else {})
    payload["store"] = {
        "id": str(store["id"]),
        "slug": store.get("slug"),
        "name": store.get("name"),
        "accreditation_status": store.get("accreditation_status"),
        "trust_tier": store.get("trust_tier"),
    }
    return payload
