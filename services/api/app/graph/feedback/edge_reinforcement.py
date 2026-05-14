"""Atualização de `rule_graph_edge_quality` com reforço / penalização."""

from __future__ import annotations

import uuid
from uuid import UUID

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


def relationship_score_v2(
    base_relationship_score: float,
    *,
    retrieval_success_boost: float,
    drift_penalty: float,
    noise_penalty: float,
    cross_query_consistency: float,
) -> float:
    return max(
        0.0,
        min(
            1.0,
            base_relationship_score
            + retrieval_success_boost
            - drift_penalty
            - noise_penalty
            + cross_query_consistency,
        ),
    )


def _parse_edge_label(label: str) -> tuple[str, str, str] | None:
    if "->" not in label or ":" not in label:
        return None
    left, right = label.split("->", 1)
    dst, rel = right.split(":", 1)
    return left.strip(), dst.strip(), rel.strip()


async def reinforce_edges(
    session: AsyncSession,
    game_id: UUID,
    edge_labels: list[str],
    *,
    success: bool,
    decay_factor: float = 0.996,
) -> int:
    """Incrementa contadores e ajusta reinforcement_score. Retorna número de UPSERTs."""
    n = 0
    delta_pos = 0.018 if success else 0.0
    delta_neg = 0.0 if success else 0.028
    succ_inc = 1 if success else 0
    fail_inc = 0 if success else 1
    for lab in edge_labels:
        parsed = _parse_edge_label(lab)
        if not parsed:
            continue
        src, dst, rel = parsed
        sql = text(
            """
            INSERT INTO tcg_judge.rule_graph_edge_quality (
                id, game_id, src_rule, dst_rule, relation,
                usage_count, successful_retrievals, failed_retrievals,
                reinforcement_score, drift_risk_score, decay_factor
            ) VALUES (
                :id, :gid, :src, :dst, :rel,
                1, :succ, :fail,
                :rs0, :drift, :decay
            )
            ON CONFLICT (game_id, src_rule, dst_rule, relation)
            DO UPDATE SET
                usage_count = tcg_judge.rule_graph_edge_quality.usage_count + 1,
                successful_retrievals = (
                    tcg_judge.rule_graph_edge_quality.successful_retrievals
                    + EXCLUDED.successful_retrievals
                ),
                failed_retrievals = (
                    tcg_judge.rule_graph_edge_quality.failed_retrievals + EXCLUDED.failed_retrievals
                ),
                reinforcement_score = LEAST(0.99, GREATEST(0.04,
                    (tcg_judge.rule_graph_edge_quality.reinforcement_score * :decay_u)
                    + :delta_pos - :delta_neg
                )),
                drift_risk_score = LEAST(0.95, GREATEST(0.02,
                    tcg_judge.rule_graph_edge_quality.drift_risk_score * 0.998 + :drift_bump
                )),
                decay_factor = EXCLUDED.decay_factor,
                updated_at = now()
            """
        )
        rs0 = 0.58 if success else 0.42
        drift_bump = 0.0 if success else 0.012
        await session.execute(
            sql,
            {
                "id": uuid.uuid4(),
                "gid": game_id,
                "src": src,
                "dst": dst,
                "rel": rel,
                "succ": succ_inc,
                "fail": fail_inc,
                "rs0": rs0,
                "drift": 0.14,
                "decay": decay_factor,
                "decay_u": decay_factor,
                "delta_pos": delta_pos,
                "delta_neg": delta_neg,
                "drift_bump": drift_bump,
            },
        )
        n += 1
    return n
