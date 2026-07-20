# Engineering Priority Queue — Hypothesis mode

**Status:** Fila operacional pós-IRB (2026-07-19)  
**Modo:** o JudgeTCG prova hipótese de mercado; engenharia serve ao loop de liquidez.  
**Relaciona:** [MRB](./MARKET_REVIEW_BOARD.md) · [ADR-014](../architecture/adr/ADR-014-testing-infrastructure-persona-composition.md) · [`NORTH_STAR_RELEASE_1.md`](../product/NORTH_STAR_RELEASE_1.md)

## Fila

| Pri | Objetivo | Critério de pronto | Status |
|-----|----------|--------------------|--------|
| **P0** | Loop LPC **pode** acontecer (publish → find → cart sem intervenção) | Path feliz + P0s cart/estoque deployados | Quase concluído |
| **P1** | Medir LPC/LCS corretamente | Eventos/invariantes no path de produto; sem seeds | Fechar instrumentação |
| **P2** | Eliminar falsos positivos | Wishlist fail-closed em Beta; sem mocks de cobertura | Fechar |
| **P3** | Ativação seller menos friccional | PIX → `shop_enabled` guiado; sellers voltam (SRR) | **Próximo** |
| **P4** | Escalar MTG / Pokémon / One Piece | Evidência R1 (LPC recorrente + LCS) | Bloqueado |

## Relatórios

| Relatório | Audiência | Conteúdo |
|-----------|-----------|----------|
| [Founder Report](./FOUNDER_REPORT_TEMPLATE.md) | Founder | 1 página: LPC/LCS/SD/SRR + gargalo + “não desenvolver” |
| Engineering Report | Engenharia | ADRs, P0 técnicos, bounded contexts, migrations — **só sob demanda** |

Default semanal: Founder Report + “nenhuma mudança estrutural de engenharia”.

## Fora da fila até evidência

SEO · IA · Chat · Social · Ranking · CSV/ERP · trust system completo · abertura multi-TCG · Sprint 9 Payment (gate LPC ≥ 1).
