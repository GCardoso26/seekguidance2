"""Geração de resposta com contexto montado hierarquicamente (judge-grade assembly)."""

from __future__ import annotations

import json
from dataclasses import dataclass

import structlog
from openai import AsyncOpenAI

from app.context.assembler import AssembledPrompt, ContextAssemblyEngine
from app.context.temporal import TemporalHint
from app.core.config import Settings
from app.judge_prompts.registry import get_game_prompt_bundle
from app.query_understanding.semantic_router import route_query
from app.retrieval.types import ChunkHit

logger = structlog.get_logger(__name__)


@dataclass
class LlmResult:
    answer: str
    model: str
    verdict: str | None = None
    rule_applied: str | None = None
    explanation: str | None = None
    exceptions: str | None = None


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
        verdict_format: bool = False,
        game_slug: str | None = None,
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

        prompt_bundle = get_game_prompt_bundle(game_slug or "mtg")
        system = (
            prompt_bundle.system_prompt
            + " Answer ONLY using the structured CONTEXT (hierarchical passages + citation index). "
            "If the context is insufficient, say so explicitly. "
            + assembled.system_supplement
        )
        if prompt_bundle.few_shot_block:
            system += "\n\nFew-shot examples:\n" + prompt_bundle.few_shot_block
        if mode == "player":
            system += (
                " Respond in Brazilian Portuguese (pt-BR). "
                "Use clear language for players. Keep official rule numbers and section paths "
                "in their original form when citing (e.g. 603.3b, CR 702.19)."
            )
            if verdict_format:
                system += (
                    " Structure the ruling as a tournament judge would: state a clear verdict, "
                    "cite the applicable rule, explain briefly, and note exceptions if any."
                )
        elif mode == "judge":
            system += (
                " Prefer citing official rule paths when applicable (e.g. 603.3b). "
                "Use precise tournament rules language."
            )

        user = assembled.user_context_block + "\n\n" + prompt_bundle.response_format
        if verdict_format and mode == "player":
            user += (
                " Verdict must be one of: Permitido, Não permitido, Depende, Informação. "
                "Include rule_applied, explanation, exceptions (or null)."
            )

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
            verdict = str(data.get("verdict", "")).strip() or None
            rule_applied = str(data.get("rule_applied", "")).strip() or None
            explanation = str(data.get("explanation", "")).strip() or None
            exceptions_raw = data.get("exceptions")
            exceptions = (
                str(exceptions_raw).strip()
                if exceptions_raw is not None and str(exceptions_raw).strip()
                else None
            )
        except json.JSONDecodeError:
            answer = raw.strip()
            verdict = None
            rule_applied = None
            explanation = None
            exceptions = None

        if not answer and explanation:
            answer = explanation
        if not answer:
            answer = "Não foi possível gerar uma resposta a partir do contexto recuperado."

        logger.info(
            "llm.compose",
            model=model,
            n_context_chunks=len(hits),
            prompt_ctx_tokens_est=assembled.metrics.get("prompt_context_tokens_est"),
        )
        return LlmResult(
            answer=answer,
            model=model,
            verdict=verdict,
            rule_applied=rule_applied,
            explanation=explanation,
            exceptions=exceptions,
        )
