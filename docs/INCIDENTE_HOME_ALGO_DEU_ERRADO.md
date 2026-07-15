# Incidente — "Algo deu errado" na home (judgetcg.com.br)

**Data da análise:** 2026-07-15
**Ambiente:** Produção — `https://judgetcg.com.br` (frontend Vercel + API Render)
**Sintoma reportado:** print de tela (mobile) exibindo o card de erro:

> **Algo deu errado**
> Ocorreu um erro inesperado. Recarregue a página ou tente novamente em instantes.
> [Tentar novamente]

---

## 1. Resumo executivo

O card do print é o **fallback genérico do `ErrorBoundary` raiz** da aplicação. Ele aparece quando uma
**exceção não tratada ocorre na renderização client-side** e o boundary substitui a página inteira por
esse card.

A causa mais provável é uma **falha de hidratação intermitente (React error #418)** na home do
marketplace, introduzida/agravada pelo **refactor RSC de streaming da home** e follow-ups enviados nos
últimos deploys. Quando o mismatch de hidratação não é recuperado, o erro sobe até o `ErrorBoundary` raiz
e exibe o "Algo deu errado". Por ser dependente de timing/dados, é **intermitente** — daí o botão
"Tentar novamente" normalmente resolver ao recarregar.

Um **problema de processo** deixou o código instável chegar em produção: o **CI está vermelho** nos
commits recentes, mas o **deploy da Vercel é disparado incondicionalmente** (deploy hook) e publica mesmo
assim.

---

## 2. Origem do card de erro (código)

- Texto exato do print vem de `PageError` em
  `frontend/runtime_console_v3/src/components/ui/async-state.tsx`
  (título "Algo deu errado", mensagem "Ocorreu um erro inesperado…", botão "Tentar novamente").
- Ele é renderizado pelo `ErrorBoundary` em
  `frontend/runtime_console_v3/src/components/ui/ErrorBoundary.tsx`, que captura erros de render via
  `getDerivedStateFromError` / `componentDidCatch`.
- O `ErrorBoundary` **envolve o app inteiro** em
  `frontend/runtime_console_v3/src/app/layout.tsx` (linha ~141).

Conclusão: qualquer exceção de renderização não tratada em qualquer página cai nesse fallback de página
inteira — foi o que apareceu no print.

---

## 3. Reprodução na produção

Acesso real ao `https://judgetcg.com.br/` com DevTools aberto:

- A home **renderiza normalmente** no momento do teste (o card de erro **não** apareceu → comportamento
  **intermitente**).
- O console dispara, de forma persistente, **`Minified React error #418`** (2 ocorrências).
- **Nenhuma** request retornou 4xx/5xx no domínio durante o teste (rede OK).
- Recarregar (hard reload) **não** eliminou o `#418`, mas a página seguiu renderizando.

### O que é o React #418
> "Hydration failed because the server rendered HTML didn't match the client. As a result this tree will
> be regenerated on the client."

Causas típicas:
- Valores não-determinísticos no render (`Date.now()`, `Math.random()`).
- **Formatação por locale** (número/data) diferente entre servidor e cliente.
- Branches `typeof window !== 'undefined'` / uso de `localStorage`/`window` no render inicial.
- **Dados externos** que mudam entre o render do servidor e a hidratação (sem snapshot).
- **Aninhamento inválido de HTML** (ex.: `<a>` dentro de `<a>`).

Quando o mismatch acontece na raiz (sem um `Suspense`/boundary que o contenha) o React regenera a árvore
inteira no client; se algo estourar nesse processo, o `ErrorBoundary` raiz exibe o "Algo deu errado".

---

## 4. Relação com os últimos deploys

Todos os commits abaixo foram para produção (branch `main`):

| Commit | Descrição | Relevância |
|---|---|---|
| `4c40155f` | RC1.1 Store Performance Recovery | **Introduziu o refactor RSC da home**: `page.tsx` passou a usar `MarketplaceHomeRsc` + `Suspense` + `MarketplaceProviders` + ilhas `dynamic(..., { ssr:false })`. Origem arquitetural do risco de hidratação. |
| `e99b22cb` | Beta analytics runtime | Analytics em runtime no client — fonte comum de divergência server/client. |
| `77af00a0` | top-movers premium terminal (Fase 1.4) | Feature grande em `/loja/tendencias`. |
| `114c5201` | "use Next Link in tendencias breadcrumb" | Corrigiu `<a>` aninhado que **"bloqueava o build de produção da Vercel"** — exatamente uma causa de `#418`. Evidência de instabilidade recente de hidratação/build. |
| `b89da3b6` | "allow RSC build without dynamic ssr:false" | Alterou fronteiras RSC/SSR. |
| `553e48b4` | corrigir sobreposição da busca no header | Ajuste de UI no header (presente na home). |
| `10fff1b8` / `512f3e23` | RC1 — instabilidade de Perf em `/loja/busca` | Confirma histórico de instabilidade recente. |
| `de8445c6` / `254b920a` | rename `LigaPassTeaser`→`ProgressoTCG` e textos | Últimos deploys; diffs limpos e consistentes — **não são a causa** por si só. |

---

## 5. Problema de processo (CI x Deploy)

Nos commits recentes:
- **CI (workflow `CI`)**: **falha** (job `api` — falha pré-existente de coleta do `pytest` por dois
  arquivos `test_intelligence.py` sem `__init__.py`, além de erros de `ruff`).
- **Playwright E2E**: **cancelado** por timeout (~30 min) — não gateia.
- **Quality Gates / smoke-test**: **falha**.
- **Vercel Deploy Hook**: **sucesso** — publica em produção **independente** do estado do CI.

Ou seja, não há gate verde protegendo o deploy do frontend. Código com bug de hidratação chega em
produção sem barreira.

Itens adjacentes observados:
- Cron **"Expire Checkout Sessions"** falhando de hora em hora com **401**
  (`/runtime/judge/checkout/expire-stale`) — problema separado de auth do endpoint.
- API em **Render free tier** (`seekguidance.onrender.com`) que "dorme"; **cold start** deixa os
  primeiros carregamentos instáveis.

---

## 6. Causa raiz (conclusão)

**Hidratação inconsistente na home (React #418)**, introduzida/agravada pelo refactor RSC de streaming da
home (`4c40155f`) e follow-ups (analytics runtime, top-movers, ajustes RSC). Ocasionalmente não é
recuperada e sobe para o `ErrorBoundary` raiz, exibindo o "Algo deu errado".

Observação importante: os componentes de dados client da home
(`TrendingCardsGrid`, `FeaturedShopsGrid`, `useCatalogHealth`) **tratam erro de fetch com fallback e não
lançam exceção** — portanto **não** são a causa. O vetor é a **divergência de hidratação** (valores por
locale / dados externos / ordem de streaming), não uma request 500.

### Hazards concretos a inspecionar
- `frontend/runtime_console_v3/src/components/home/CatalogMarketplaceSection.tsx:60`
  usa `health.total_cards.toLocaleString("pt-BR")` (formatação por locale — clássico gerador de `#418`).
- Divergência entre o snapshot `MOCK_CATALOG_HEALTH` (bootstrap SSR) e os dados reais de
  `fetchCatalogHealth()` no stream/ilhas.
- Código de analytics/`typeof window` recém-adicionado (`e99b22cb`).

---

## 7. Nível de confiança / como confirmar 100%

- **Confirmado:** a **categoria** do problema (hidratação / React `#418`), reproduzida em navegador real.
- **Não confirmado:** a **linha exata** do mismatch — o build de produção é minificado.

Para apontar o componente/linha exata:
1. Habilitar **source maps** no build da Vercel, **ou** rodar `next dev` (build não-minificado) para ver o
   diff de hidratação com o nome do componente; **ou**
2. Adicionar **telemetria de hydration error** (interceptar `console.error` filtrando
   `418` / `425` / `"did not match"` e enviar via `navigator.sendBeacon`).

---

## 8. Recomendações

1. **Gate de deploy**: tornar o deploy da Vercel dependente do CI verde (ou, no mínimo, de
   `build` + `lint` + `type-check` do frontend) em vez do deploy hook incondicional.
2. **Corrigir o mismatch de hidratação**:
   - Evitar `toLocaleString`/formatação por locale em render SSR-hidratado — formatar em `useEffect` /
     `useSyncExternalStore`, ou enviar a string já formatada do servidor.
   - Garantir que o hero e as seções usem o **mesmo snapshot** de dados no servidor e no cliente.
3. **Cron `expire-stale` (401)**: corrigir a autenticação do endpoint agendado.
4. **Cold start**: manter a API Render aquecida (ping/health) ou migrar de tier para evitar instabilidade
   nos primeiros loads.
5. **Observabilidade**: instrumentar hydration errors em produção para localizar rapidamente regressões
   futuras.

---

## 9. Evidências / referências de código

- `frontend/runtime_console_v3/src/app/layout.tsx` — `ErrorBoundary` raiz (~linha 141).
- `frontend/runtime_console_v3/src/components/ui/ErrorBoundary.tsx` — captura de erro + fallback.
- `frontend/runtime_console_v3/src/components/ui/async-state.tsx` — `PageError` (texto do print).
- `frontend/runtime_console_v3/src/app/page.tsx` — home usando `MarketplaceHomeRsc` + `Suspense` +
  `MarketplaceProviders`.
- `frontend/runtime_console_v3/src/components/marketplace/MarketplaceHomeRsc.tsx` — estrutura de streaming
  RSC da home.
- `frontend/runtime_console_v3/src/components/marketplace/MarketplaceHomeInteractiveSections.tsx` — ilhas
  `dynamic(..., { ssr:false })`.
- `frontend/runtime_console_v3/src/components/home/CatalogMarketplaceSection.tsx` — `toLocaleString("pt-BR")`.
- Commit de referência do refactor: `4c40155f` (RC1.1 Store Performance Recovery).
