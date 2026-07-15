"""CompanyService — CNPJ checksum only (no RF)."""

from __future__ import annotations

import os
from typing import Any

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.identity_platform.adapters.rc1_store import list_owner_stores
from app.identity_platform.domain.cnpj import is_valid_cnpj, normalize_cnpj
from app.identity_platform.domain.enums import CompanyKycStatus, CompanyStatus


def dual_write_enabled() -> bool:
    return os.getenv("IDENTITY_DUAL_WRITE", "").lower() in {"1", "true", "yes"}


class CompanyService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_for_user(self, user_id: str) -> dict[str, Any] | None:
        row = (
            await self._session.execute(
                text(
                    """
                    SELECT c.*
                    FROM tcg_judge.companies c
                    JOIN tcg_judge.company_representatives r ON r.company_id = c.id
                    WHERE r.user_id = :uid
                    ORDER BY r.is_legal_rep DESC, c.created_at ASC
                    LIMIT 1
                    """
                ),
                {"uid": user_id},
            )
        ).mappings().first()
        return dict(row) if row else None

    async def create(
        self,
        user_id: str,
        *,
        cnpj: str,
        legal_name: str,
        trade_name: str | None = None,
        state_registration: str | None = None,
        address: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        digits = normalize_cnpj(cnpj)
        if not is_valid_cnpj(digits):
            raise HTTPException(400, "CNPJ inválido")
        existing = (
            await self._session.execute(
                text("SELECT id FROM tcg_judge.companies WHERE cnpj = :cnpj LIMIT 1"),
                {"cnpj": digits},
            )
        ).first()
        if existing:
            raise HTTPException(409, "CNPJ já cadastrado")

        row = (
            await self._session.execute(
                text(
                    """
                    INSERT INTO tcg_judge.companies (
                      cnpj, legal_name, trade_name, state_registration,
                      address, status, kyc_status, trust_score, created_by
                    ) VALUES (
                      :cnpj, :legal, :trade, :ie,
                      CAST(:addr AS jsonb), :status, :kyc, 0, :uid
                    )
                    RETURNING *
                    """
                ),
                {
                    "cnpj": digits,
                    "legal": legal_name,
                    "trade": trade_name,
                    "ie": state_registration,
                    "addr": __import__("json").dumps(address or {}),
                    "status": CompanyStatus.ACTIVE.value,
                    "kyc": CompanyKycStatus.DRAFT.value,
                    "uid": user_id,
                },
            )
        ).mappings().first()
        await self._session.execute(
            text(
                """
                INSERT INTO tcg_judge.company_representatives (company_id, user_id, is_legal_rep)
                VALUES (:cid, :uid, TRUE)
                ON CONFLICT (company_id, user_id) DO UPDATE SET is_legal_rep = TRUE
                """
            ),
            {"cid": row["id"], "uid": user_id},
        )
        await self._session.commit()
        return dict(row)

    async def ensure_from_store_owner(self, user_id: str) -> dict[str, Any]:
        """Lazy bootstrap: placeholder company without inventing a fake CNPJ."""
        current = await self.get_for_user(user_id)
        if current:
            return current
        stores = await list_owner_stores(self._session, user_id)
        if not stores:
            raise HTTPException(404, "Nenhuma loja para vincular company")

        row = (
            await self._session.execute(
                text(
                    """
                    INSERT INTO tcg_judge.companies (
                      cnpj, legal_name, trade_name, address, status, kyc_status, trust_score, created_by
                    ) VALUES (
                      NULL, :legal, :trade, '{}'::jsonb, :status, :kyc, 0, :uid
                    )
                    RETURNING *
                    """
                ),
                {
                    "legal": stores[0].get("name") or "Empresa pendente",
                    "trade": stores[0].get("name"),
                    "status": CompanyStatus.PENDING_CNPJ.value,
                    "kyc": CompanyKycStatus.DRAFT.value,
                    "uid": user_id,
                },
            )
        ).mappings().first()
        await self._session.execute(
            text(
                """
                INSERT INTO tcg_judge.company_representatives (company_id, user_id, is_legal_rep)
                VALUES (:cid, :uid, TRUE)
                """
            ),
            {"cid": row["id"], "uid": user_id},
        )
        for store in stores:
            await self._session.execute(
                text(
                    """
                    UPDATE tcg_judge.stores
                    SET company_id = :cid
                    WHERE id = CAST(:sid AS uuid) AND company_id IS NULL
                    """
                ),
                {"cid": row["id"], "sid": store["id"]},
            )
        await self._session.commit()
        return dict(row)

    async def patch(self, user_id: str, fields: dict[str, Any]) -> dict[str, Any]:
        company = await self.get_for_user(user_id)
        if not company:
            raise HTTPException(404, "Company não encontrada")
        allowed = {"legal_name", "trade_name", "state_registration", "address"}
        updates = {k: v for k, v in fields.items() if k in allowed and v is not None}
        if "cnpj" in fields and fields["cnpj"]:
            digits = normalize_cnpj(str(fields["cnpj"]))
            if not is_valid_cnpj(digits):
                raise HTTPException(400, "CNPJ inválido")
            if company.get("cnpj") and company["cnpj"] != digits:
                raise HTTPException(400, "CNPJ já definido não pode ser alterado nesta fase")
            updates["cnpj"] = digits
            updates["status"] = CompanyStatus.ACTIVE.value
        if not updates:
            return company
        sets = []
        params: dict[str, Any] = {"cid": company["id"]}
        for key, value in updates.items():
            if key == "address":
                sets.append("address = CAST(:address AS jsonb)")
                params["address"] = __import__("json").dumps(value)
            else:
                sets.append(f"{key} = :{key}")
                params[key] = value
        sets.append("updated_at = NOW()")
        row = (
            await self._session.execute(
                text(f"UPDATE tcg_judge.companies SET {', '.join(sets)} WHERE id = :cid RETURNING *"),
                params,
            )
        ).mappings().first()
        await self._session.commit()
        return dict(row) if row else company
