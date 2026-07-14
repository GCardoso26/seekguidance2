from __future__ import annotations

from app.reputation.reputation_engine import get_seller_reputation_dashboard
from sqlalchemy.ext.asyncio import AsyncSession


class ReputationContextProvider:
    name = "reputation"

    async def fetch(self, session: AsyncSession, owner_id: str, store_id: str) -> dict:
        rep = await get_seller_reputation_dashboard(session, store_id)
        history = rep.get("history") or []
        delta = 0.0
        if len(history) >= 2:
            try:
                delta = float(history[0].get("to_score") or 0) - float(history[1].get("to_score") or 0)
            except (TypeError, ValueError):
                delta = 0.0
        return {
            "dashboard": rep,
            "trust_score": float(rep.get("trust_score") or rep.get("score") or 75),
            "seller_level": str(rep.get("seller_level") or "new"),
            "score_delta": round(delta, 1),
            "alerts_count": int(rep.get("alerts_count") or 0),
        }
