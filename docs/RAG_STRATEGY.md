# Estratégia RAG

## Pipeline

1. **Ingestão** → texto limpo + metadados (jogo, tipo de doc, idioma, versão, publisher).
2. **Chunking semântico** → janelas com overlap; quebras preferenciais em headings / números de regra (§).
3. **Embeddings** → modelo configurável (`DEFAULT_EMBEDDING_MODEL`); dimensão alinhada à coluna `vector(1536)`.
4. **Retrieval híbrido** → BM25 (Postgres `tsvector` ou OpenSearch) **+** similaridade coseno pgvector.
5. **Reranking** → cross-encoder leve ou API de rerank (Cohere/Voyage) para top-k.
6. **Geração** → prompt com *citation-only* policy: só afirmar o que aparecer nos trechos.
7. **Pós-processamento** → confidence heurístico (cobertura de trechos + acordo entre fontes).

## Metadados obrigatórios por chunk

- `game_slug`, `doc_type` (CR, MTR, IPG, FAQ…), `version`, `effective_date`, `language`, `region`, `publisher`, `format` (Competitivo / Casual / Limited).

## Modos

| Modo | System prompt | Saída |
|------|----------------|-------|
| **player** | Didático, exemplos, menos jargão | Resumo + citações |
| **judge** | Técnico, CR completo, IPG/MTR | Resposta longa + infrações + referências |

## Incerteza

Quando `confidence < threshold`, responder com **pergunta de clarificação** e listar trechos ambíguos — nunca inventar número de regra.

## Provider-agnostic LLM

Interface única `LLMClient` com implementações: OpenAI, Anthropic, Gemini, Ollama. Feature flags no Admin para rollout gradual.
