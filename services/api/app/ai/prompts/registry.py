"""Prompt templates versionados — nunca concatenar strings ad-hoc."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class PromptTemplate:
    id: str
    version: str
    objective: str
    language: str
    variables: tuple[str, ...]
    template: str


PROMPT_REGISTRY: dict[str, PromptTemplate] = {
    "daily_brief_v1": PromptTemplate(
        id="daily_brief_v1",
        version="1.0.0",
        objective="Resumo operacional diário para o lojista",
        language="pt-BR",
        variables=(
            "greeting",
            "opportunity_count",
            "low_stock_count",
            "missing_image_count",
            "late_orders_count",
            "open_tickets_count",
            "reputation_delta",
            "expected_payout_cents",
        ),
        template=(
            "{greeting}.\n\n"
            "Hoje encontrei {opportunity_count} oportunidades.\n"
            "- {low_stock_count} produtos com estoque baixo\n"
            "- {missing_image_count} anúncios sem imagem\n"
            "- {late_orders_count} pedidos atrasados\n"
            "- {open_tickets_count} tickets aguardando resposta\n"
            "Recebimentos previstos: R$ {expected_payout_display}"
        ),
    ),
}


def render_prompt(prompt_id: str, variables: dict[str, Any]) -> tuple[str, PromptTemplate]:
    tpl = PROMPT_REGISTRY.get(prompt_id)
    if not tpl:
        raise KeyError(f"Prompt não registrado: {prompt_id}")
    missing = [v for v in tpl.variables if v not in variables]
    if missing:
        raise ValueError(f"Variáveis ausentes em {prompt_id}: {missing}")
    return tpl.template.format(**variables), tpl
