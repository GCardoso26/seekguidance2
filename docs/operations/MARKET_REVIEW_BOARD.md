# Market Review Board (MRB) — Camada 8

**Status:** Ritual operacional permanente  
**Camada:** Operação / valor de mercado — **não** é QA de engenharia  
**Relaciona:** [`NORTH_STAR_RELEASE_1.md`](../product/NORTH_STAR_RELEASE_1.md) · [`BETA_COMMAND_CENTER.md`](./BETA_COMMAND_CENTER.md) · [`FOUNDER_REPORT_TEMPLATE.md`](./FOUNDER_REPORT_TEMPLATE.md) · [ADR-014](../architecture/adr/ADR-014-testing-infrastructure-persona-composition.md)

## Separação obrigatória

| Camada | Pergunta | Quem |
|--------|----------|------|
| QA / Testing (camadas 1–7) | O sistema **funciona**? | Engenharia |
| **MRB (camada 8)** | Isso **vale a pena existir**? | Founder + board de mercado |
| North Star | A hipótese de liquidez está sendo **provada**? | LPC · LCS · SD (+ SRR supporting) |

O MRB **nunca**:

- propõe arquitetura, DDD, migrations ou providers;
- alimenta dashboards com seeds/simulation (ADR-014);
- redefine o North Star ou abre Sprint 9 sem LPC ≥ 1;
- trata TCS/PCS como Go/No-Go de produto.

## Por que existe

O JudgeTCG deixou de ser “construir marketplace” e passou a ser **provar uma hipótese de mercado** (R1 Lorcana-first).

Engenharia garante que o loop LPC **possa** acontecer.  
O MRB pergunta se alguém **quer** que ele aconteça de novo.

## Agentes permanentes

Cada agente responde **só** à sua pergunta. Sem misturar papéis.

### 1. Hobby Store Owner

**Pergunta diária:** Se eu tivesse uma loja hoje, por que eu colocaria meu estoque aqui?

Pode responder: não vejo vantagem · falta confiança · demora publicar · concorrente faz melhor.

Só operação. Zero arquitetura.

### 2. Competitive Player

**Pergunta:** Eu realmente compraria aqui?

Olha: busca · filtros · staples · rapidez.

### 3. Collector

**Pergunta:** Eu consigo encontrar exatamente a minha carta?

Olha: promo · enchanted · foil · idioma · condição · collector number.

### 4. Marketplace Economist

**Pergunta:** Existe economia aqui?

Olha **apenas:** Oferta → Liquidez → Preço → Retenção.

Não olha UX, código nem React.

### 5. Search Specialist (mercado)

**Pergunta:** Alguém encontra a carta?

Mede: synonym · ranking · autocomplete · zero results · watchlist coverage.

### 6. Marketplace Trust

**Pergunta:** Eu confiaria R$ 2.000 nesta loja?

Olha: reputação · histórico · reviews · transparência · fotos · seller profile.

No R1 o score tende a ser baixo — **confiança ainda não é escopo do beachhead**. Registrar o gap; **não** abrir feature de trust sem evidência de LPC/LCS.

### 7. Growth

**Pergunta:** Onde o funil morre?

Olha **apenas:** Aquisição → Activation → Retention → Referral.

### 8. Release Auditor

Decide **GO / NO-GO** para o próximo marco (Beta · Sprint 9 · R2 · R3), subordinado ao North Star.

## Cadência

| Marco | Foco do MRB |
|-------|-------------|
| Diário (≤10 min) | Hobby Store Owner + Growth (funil do dia) |
| Semanal | Founder Report (1 página) + Economist + Search |
| Antes Sprint 9 | Release Auditor: LPC ≥ 1 real? |
| Antes R2 / R3 | Trust + Economist + Competitive Player no novo TCG |

## Saídas

1. **Founder Report** — 1 página ([template](./FOUNDER_REPORT_TEMPLATE.md))  
2. **Engineering Report** — só se houver P0 técnico; senão “nenhuma mudança estrutural”  
3. **Decisão:** features / não-features da semana (default = **não desenvolver**)

## Fila de prioridade (Principal Engineer)

| Pri | Objetivo | Status típico pós-IRB |
|-----|----------|------------------------|
| **P0** | Garantir que o loop LPC possa acontecer | Quase concluído (fechar deploy P0s) |
| **P1** | Medir LPC/LCS corretamente | Concluído / fechar instrumentação path real |
| **P2** | Eliminar falsos positivos de métricas | Concluído / wishlist fail-closed |
| **P3** | Ativação do seller menos friccional | **Próximo passo** |
| **P4** | Escalar MTG / Pokémon / One Piece | Somente após evidência R1 |

Mais código **não** aumenta automaticamente o valor do produto. Próximas decisões dependem de evidência (LPC, LCS, SD, **SRR**).
