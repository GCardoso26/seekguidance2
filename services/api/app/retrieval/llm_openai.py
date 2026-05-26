"""Geração de resposta com contexto montado hierarquicamente (judge-grade assembly)."""

from __future__ import annotations

import json
from dataclasses import dataclass

import structlog
from openai import AsyncOpenAI

from app.context.assembler import AssembledPrompt, ContextAssemblyEngine
from app.context.temporal import TemporalHint
from app.core.config import Settings
from app.query_understanding.semantic_router import route_query
from app.retrieval.types import ChunkHit

logger = structlog.get_logger(__name__)


@dataclass
class LlmResult:
    answer: str
    model: str


class LlmComposer:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    async def compose(
        self,
        *,
        question: str,
        hits: list[ChunkHit],
        mode: str,
        assembled: AssembledPrompt | None = None,
    ) -> LlmResult:
        if not self._settings.openai_api_key:
            raise RuntimeError("OPENAI_API_KEY ausente")

        if assembled is None:
            hint = route_query(question, prefer_historical=None)
            temporal = TemporalHint(prefer_historical=False, as_of=None)
            assembled = ContextAssemblyEngine(self._settings).assemble(
                question=question,
                mode=mode,
                hits=hits,
                hint=hint,
                temporal=temporal,
            )

        system = (
            "You are an expert trading card game rules assistant. "
            "Answer ONLY using the structured CONTEXT (hierarchical passages + citation index). "
            "If the context is insufficient, say so explicitly. "
            "Do not invent rule numbers. " + assembled.system_supplement
        )
        if mode == "player":
            system += (
                " Respond in Brazilian Portuguese (pt-BR). "
                "Use clear language for players. Keep official rule numbers and section paths "
                "in their original form when citing (e.g. 603.3b, CR 702.19)."
            )
        elif mode == "judge":
            system += (
                " Prefer citing official rule paths when applicable (e.g. 603.3b). "
                "Use precise tournament rules language."
            )

        user = assembled.user_context_block + "\n\nReturn JSON with keys: answer (string)."

        client = AsyncOpenAI(api_key=self._settings.openai_api_key)
        model = self._settings.default_chat_model
        resp = await client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            response_format={"type": "json_object"},
            temperature=0.2,
        )
        raw = resp.choices[0].message.content or "{}"
        try:
            data = json.loads(raw)
            answer = str(data.get("answer", "")).strip()
        except json.JSONDecodeError:
            answer = raw.strip()

        if not answer:
            answer = "Não foi possível gerar uma resposta a partir do contexto recuperado."

        logger.info(
            "llm.compose",
            model=model,
            n_context_chunks=len(hits),
            prompt_ctx_tokens_est=assembled.metrics.get("prompt_context_tokens_est"),
        )
        return LlmResult(answer=answer, model=model)
