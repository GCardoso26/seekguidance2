# Sprint 8 Plan — Beta fechado (Lorcana-First)

**Status:** Founder-led marketplace validation · **beachhead = Disney Lorcana Brasil**  
**Código:** congelado após Lote 1 (exceto P0)  
**MVP:** [`MVP_1_0_RELEASE_PLAN.md`](../architecture/MVP_1_0_RELEASE_PLAN.md)  
**North Star:** [`NORTH_STAR_RELEASE_1.md`](./NORTH_STAR_RELEASE_1.md) — **LPC** + **LCS** (+ **SD**) · [`LPC_ANALYTICS_SPEC.md`](./LPC_ANALYTICS_SPEC.md)

### Artefatos

| Doc | Uso |
|-----|-----|
| [`NORTH_STAR_RELEASE_1.md`](./NORTH_STAR_RELEASE_1.md) | LPC / LCS / `liquidity_proof_completed` |
| [`BETA_WAVE1_OPERATION_PROTOCOL.md`](../operations/BETA_WAVE1_OPERATION_PROTOCOL.md) | Checklist + hipóteses |
| [`BETA_COMMAND_CENTER.md`](../operations/BETA_COMMAND_CENTER.md) | Watchlist + LPC/LCS diário |
| [`SELLER_BETA_ONBOARDING_RUNBOOK.md`](../operations/SELLER_BETA_ONBOARDING_RUNBOOK.md) | Convites Lorcana |
| [`BETA_REPORT_0_BASELINE.md`](../operations/BETA_REPORT_0_BASELINE.md) | Baseline (LPC=0, LCS=0) |
| [`BETA_INTERVIEW_SCRIPT.md`](../operations/BETA_INTERVIEW_SCRIPT.md) | Entrevistas |

## Camadas (não misturar)

| Camada | Conteúdo |
|--------|----------|
| Foundation | Genérica — nada conhece Lorcana |
| Beachhead | R1 = LORCANA (Provider) |
| Mercado | Hipótese: plataforma especializada gera liquidez? |

## Pergunta da Onda 1

> Existe um grupo que quer colocar **cartas de Disney Lorcana** aqui antes de existirem compradores?

## North Star + metas

| KPI / métrica | Meta |
|---------------|------|
| **LPC** | ≥1 (R1-LPC-001); acompanhar tendência |
| **LCS** | ≥80% |
| **SD** | Supporting (mediana listings/loja) |
| Lojas especializadas ativas | ≥5 |
| Listings relevantes | **150–300** |

## Liquidity Proof (= 1 unidade de LPC)

```text
Loja A publica Rapunzel – Gifted with Healing
  → Jogador B (≠ A) busca / abre PDP
  → Visualiza oferta
  → Adiciona ao carrinho
```

Sem intervenção. **Não** é ligar Stripe.

## Default de produto

`game = lorcana` no beachhead do Release 1.  
MTG e demais TCGs = expansão via Provider Adapter depois.

## Bloqueios

❌ Multi-TCG no beta · ❌ CSV · ❌ dashboard ERP · ❌ SEO · ❌ payment antes de LPC recorrente · ❌ IA
