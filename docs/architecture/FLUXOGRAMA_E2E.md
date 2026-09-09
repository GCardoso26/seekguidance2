# JudgeTCG — Fluxograma funcional E2E (MS Visio)

**Público:** desenvolvedores e gestores documentais.  
**Arquivo Visio:** [`visio/JudgeTCG_Fluxograma_E2E.vsdx`](visio/JudgeTCG_Fluxograma_E2E.vsdx)  
**Alternativa diagrams.net:** [`visio/JudgeTCG_Fluxograma_E2E.drawio`](visio/JudgeTCG_Fluxograma_E2E.drawio)  
**Prévia HTML:** [`visio/JudgeTCG_Fluxograma_E2E.html`](visio/JudgeTCG_Fluxograma_E2E.html)

Regenerar a partir do stencil extraído:

```bash
unzip -qo docs/architecture/visio/stencils/Judge_doc.vsdx -d /tmp/visio_vsdx
python3 scripts/generate_judgetcg_e2e_visio.py
```

## Fontes (hierarquia)

1. Stencil e paleta do `Judge_doc.vsdx` (formas Fluxograma Básico: Início/Término, Processo, Subprocesso, Decisão, Dados, Dados Externos).
2. Passos S01–S99 da planilha `TCG_Judge_Fluxograma_E2E_Visio.xlsx` (consulta Judge RAG).
3. Código e ADRs do repositório — o que o sistema **faz de fato**:
   - Frontend BFF (`frontend/runtime_console_v3/src/app/api/*`)
   - FastAPI (`services/api/app/main.py`)
   - Schema `tcg_judge` + pgvector; schema `public` (Supabase/RLS) em marketplace
   - Redis (cache, rate limit, revogação)
   - North Star R1 / ADR-018 (liquidez de oferta **CNPJ**, não volume CPF-seller)

O cilindro “Banco de dados” do stencil original **não estava** nos mestres do `.vsdx` enviado. Consultas SQL internas usam a forma **Dados** (paralelogramo laranja); APIs e CDNs usam **Dados Externos**.

## Páginas do `.vsdx`

| Página | Para quem | O que mostra |
|--------|-----------|----------------|
| **Página-1** | Gestores | Capa no modelo `Judge_doc.vsdx`: Início → hero → Validação de API → Carga API TCG |
| **Legenda** | Ambos | Formas e cores do stencil Fluxograma Básico |
| **Início** | Gestores | BFF → validação → ramifica Judge, Marketplace, Catálogo, Auth, Checkout, Ingestão |
| **Validação API** | Ops / devs | Health `/v1/health`, FastAPI, fallback Render, auth fail-closed, rate limit |
| **Judge RAG** | Devs | Excel S01–S99: middlewares, Redis, HybridRetriever, pgvector, FTS, OpenAI |
| **Marketplace** | Gestores + produto | PDP, listings, ADR-018 CNPJ local (`companies`), CEP BrasilAPI, LPC |
| **Catálogo** | Devs | Cartas (Scryfall etc.), selados (TCGCSV/TCGplayer), acessórios (Shopify/Woo/Shopware/Tray) |
| **Auth** | Ambos | Supabase JWT, fail-closed em prod, Redis revoke, identity_platform |
| **Checkout** | Ambos | Stripe Checkout/Connect, PIX, webhook, Melhor Envio, pedido SQL |
| **Ingestão** | Devs | `/runtime/admin/ingestion`, embeddings, chunks pgvector + FTS |
| **Tudo** | Ambos | Mapa de sistemas: Vercel, Render, Postgres, Redis, OpenAI, pagamentos, workers |

Subprocessos verdes na página **Início** têm hiperlink Visio para a página de detalhe.

## Leituras paralelas (código)

| Camada | Evidência |
|--------|-----------|
| Frontend / BFF | `docs/ARCHITECTURE.md`; `src/app/api/proxy`, `api/bff`, `api/games`, `api/health` |
| API | `services/api/app/main.py` (routers runtime, marketplace, catalog, checkout, stores) |
| Judge | `POST /runtime/judge/query` (anônimo só em `development`) |
| Auth | Supabase JWT; header `X-Judge-User-Id`; RBAC |
| Banco Judge | `infra/db/*.sql` schema `tcg_judge`; `sql_retrieval.py` (`<=>` pgvector + `to_tsvector`) |
| LLM | `llm_openai.py` |
| CNPJ | Validação local `identity_platform.domain.cnpj` → `tcg_judge.companies` (ADR-018). Sem lookup Receita no código. |
| CEP | `frontend/runtime_console_v3/src/app/api/geo/cep/[cep]/route.ts` → BrasilAPI `/api/cep/v2` |
| Frete | `services/api/app/marketplace/freight_quote.py` → Melhor Envio |
| North Star | `docs/product/NORTH_STAR_RELEASE_1.md` (LPC); ADR-018 |

## O que este diagrama **não** inventa

- Não substitui ADR nem Platform Constitution.
- Não trata seeds/simulação em Beta como liquidez.
- NEXUS / Content War Machine só entra no mapa se estiver em `main`; o fluxo documenta o núcleo Judge + marketplace + catálogo.
