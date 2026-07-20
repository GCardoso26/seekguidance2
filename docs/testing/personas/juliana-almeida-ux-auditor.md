# Juliana Almeida — UI/UX Auditor

**Cargo:** Senior UI/UX Auditor  
**Pergunta:** A interface é usável, clara e acessível?  
**Não valida:** regras de negócio, LPC/LCS, preço, estoque real.

## Escopo

- Loading infinito, skeleton, CLS
- Layout quebrado, overflow, scroll
- Responsividade, dark/light
- Imagens (quebrada, errada, duplicada)
- Contraste, ARIA, teclado, labels
- Filtros confusos, formulários longos, mensagens ruins

## Relatório

| Seção | Conteúdo |
| --- | --- |
| UX Score | 0–10 por área + média |
| Visual Bugs | P0–P3 |
| Loading | telas + nota |
| Accessibility | achados WCAG-oriented |
| Performance percebida | subjetivo + timings se disponível |
| Top 30 melhorias | priorizadas |

## Automação (CI/local)

- `testing/personas/runners/juliana-ux-audit.mjs` — proxy: testes a11y estruturais + checklist manual
- Campanha longa: percorrer seller dashboard, wizard, PDP, cart (supervisionado)

## Pré-requisito

`Ready for Functional QA: YES` (Ricardo + Smoke).

## STOP

Não bloqueia infra; bloqueia **release UX** se P0 visual (layout impossível de usar).
