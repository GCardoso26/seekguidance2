# Release 4 — Evidence Release

**Status:** Diretriz pós-R3  
**Tipo:** Release de **evidências** — não é release de desenvolvimento puro  
**Data:** 2026-07-20  
**Relaciona:** [PLATFORM_CONSTITUTION.md](../architecture/PLATFORM_CONSTITUTION.md) · [North Star R1](../product/NORTH_STAR_RELEASE_1.md) · [MARKET_REVIEW_BOARD.md](./MARKET_REVIEW_BOARD.md) · [TECHNICAL_DEBT_REGISTER.md](../architecture/TECHNICAL_DEBT_REGISTER.md)

---

## Objetivo

**Reduzir incertezas** — não aumentar código.

| Pergunta obrigatória por tarefa | Se a resposta for… |
| --- | --- |
| **Reduz uma incerteza mensurável?** | Pode entrar no R4 |
| **Só adiciona funcionalidade?** | **Não entra** |

Incerteza típica a reduzir:

- Os usuários reais formam o loop de liquidez no beachhead?
- Placeholders de coverage refletem o Beta?
- MTG pode sair de SHADOW com evidência de certificação?
- O Dual Stack Checkout ainda é o menor risco até unificar?

---

## O que R4 **é**

- Observar **Onda 1** (usuários reais, Beta).
- Alimentar Market Readiness / Marketplace Coverage com **dados reais** (Debt TD-002 / TD-005).
- Fechar critérios de remoção no [Technical Debt Register](../architecture/TECHNICAL_DEBT_REGISTER.md) quando a evidência existir.
- Decisões Go/No-Go pelo **North Star** e MRB — não por readiness ops.

## O que R4 **não** é

- R4 de “mais jogos” sem Playbook + certification.
- Novos bounded contexts, Payment expandido, SEO, IA, Social, Ranking, ERP, CSV.
- Reabrir Foundation / Marketplace / Catalog congelados por preferência (Constituição).
- Usar TCS/PCS/health/maturity como prova de mercado.

---

## Allowlist comercial (ADR-013) vs Evidence Release

A allowlist R3/R4 de **TCGs** (One Piece, Digimon, … / Riftbound, Naruto) **permanece**.  
O **Evidence Release** é a **fase de engenharia/ops** imediatamente após o framework R3: prioriza evidência **antes** de investir no próximo provider LIVE.

Novo TCG LIVE só após:

1. Evidência de que o beachhead justifica expansão, **e**
2. Expansion Playbook 1–10 + certification.

---

## Gate de saída do Evidence Release

O Evidence Release termina quando o MRB puder responder com dados reais:

1. Hipótese de liquidez do beachhead: sustentada / rejeitada / inconclusiva.
2. Débitos TD-002 e TD-005: removidos ou reescritos com critério novo.
3. Próximo investimento de engenharia (ex.: MTG Canary) justificado por evidência — não por roadmap aspiracional.

Até lá: **Platform Freeze** permanece (Constituição).

## Depois do Evidence Release

[Release 5 — Market Learning](./MARKET_LEARNING_R5.md): telemetria real, heatmaps, founder interviews, MRB orientado a evidência. **Aprender, não construir.**
