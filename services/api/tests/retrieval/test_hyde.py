"""Testes HyDE e fusão RRF ponderada."""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch
from uuid import UUID, uuid4

import pytest
from app.judge.registry import corpus_language_for_game_slug
from app.retrieval.fusion import weighted_rrf_merge_two_lists
from app.retrieval.hyde import generate_hypothetical_document


@pytest.mark.asyncio
async def test_generate_hypothetical_document_success():
    mock_choice = MagicMock()
    mock_choice.message.content = "702.19 Trample assigns combat damage."
    mock_response = MagicMock()
    mock_response.choices = [mock_choice]

    mock_client = MagicMock()
    mock_client.chat.completions.create = AsyncMock(return_value=mock_response)

    with patch("app.retrieval.hyde.AsyncOpenAI", return_value=mock_client):
        doc = await generate_hypothetical_document(
            "O que é trample?",
            "Magic: The Gathering",
            openai_api_key="sk-test",
        )
    assert doc is not None
    assert "Trample" in doc or "702" in doc


@pytest.mark.asyncio
async def test_generate_hypothetical_document_failure_returns_none():
    mock_client = MagicMock()
    mock_client.chat.completions.create = AsyncMock(side_effect=RuntimeError("api down"))

    with patch("app.retrieval.hyde.AsyncOpenAI", return_value=mock_client):
        doc = await generate_hypothetical_document(
            "pergunta",
            "MTG",
            openai_api_key="sk-test",
        )
    assert doc is None


def test_weighted_rrf_merge_prefers_hyde_when_weight_high():
    a, b, c = uuid4(), uuid4(), uuid4()
    merged = weighted_rrf_merge_two_lists([a, b], [c, a], weight_b=0.9)
    assert merged[0] == a
    assert c in merged


def test_corpus_language_mtg_is_en():
    assert corpus_language_for_game_slug("mtg") == "en"
