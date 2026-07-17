# LPC Analytics Spec — Release 1

**Status:** Congelado (framework de métricas R1)  
**North Star:** [`NORTH_STAR_RELEASE_1.md`](./NORTH_STAR_RELEASE_1.md)  
**Implementação de referência:** `apps/web/src/analytics/liquidityProof.ts`

Esta especificação define o que **conta** como Liquidity Proof.  
Implementações (frontend sink, warehouse, dashboard) devem ser verificáveis contra estas invariantes — não o contrário.

---

## Critério de entrada vs critério de escala

| | Critério de entrada | Critério de escala |
|--|---------------------|--------------------|
| Pergunta | **É possível acontecer?** | **Isso acontece repetidamente?** |
| Métrica | LPC ≥ 1 (absoluto) | Tendência: LPC/semana, lojas distintas, buyers distintos |
| Papel no R1 | Gate formal Sprint 8 → 9 | Evolui o beta; **não** altera o gate agora |
| Risco que reduz | Produto incapaz de conectar oferta×demanda | Evento isolado / não repetível |

No Release 1, responder à primeira já reduz muito o risco do produto.  
Conforme o beta evolui, a tendência naturalmente passa a importar mais que o valor absoluto — sem reinterpretar o gate no meio da janela de observação.

---

## Invariantes LPC (especificação verificável)

Um evento só materializa `liquidity_proof_completed` (e incrementa LPC) se **todas** forem verdadeiras:

| ID | Invariante | Regra |
|----|------------|-------|
| **R1-LPC-001** | Atores distintos | `buyerId != sellerId` |
| **R1-LPC-002** | Oferta real | `offerCount >= 1` em `buyer_offers_viewed` |
| **R1-LPC-003** | Ordem temporal | `buyer_add_to_cart.at >= buyer_offers_viewed.at` (após offers) |
| **R1-LPC-004** | Mesma carta | Todos os eventos do proof compartilham o mesmo `cardId` |
| **R1-LPC-005** | Janela | `cart.at - published.at <= 7 dias` (default `windowMs = 604800000`) |

### Cadeia obrigatória (mesmo `cardId`, R1-LPC-004)

```text
seller_listing_published
      ↓
buyer_card_open          (buyer ≠ seller — R1-LPC-001)
      ↓
buyer_offers_viewed      (offerCount ≥ 1 — R1-LPC-002)
      ↓
buyer_add_to_cart        (após offers — R1-LPC-003)
```

Tudo dentro de **R1-LPC-005**.

### Identidade de ator

- Preferir `userId`
- Fallback: `sessionId`
- Não misturar seller `userId` com buyer `sessionId` do mesmo humano de forma a burlar R1-LPC-001
- `assistedByTeam === true` → excluir do LPC

### Notas de implementação

| Caso | Comportamento |
|------|----------------|
| `offerCount` ausente | **Não** conta (R1-LPC-002 exige evidência explícita ≥ 1) |
| Self-buy / mesma loja | Excluir (R1-LPC-001) |
| Cart sem offers prévio | Excluir (R1-LPC-003) |
| cardIds divergentes na cadeia | Excluir (R1-LPC-004) |
| Fora da janela de 7 dias | Excluir (R1-LPC-005) |

Constante no código: `LPC_INVARIANTS` / `DEFAULT_LPC_WINDOW_MS` em `liquidityProof.ts`.

---

## Congelamento

Este documento + [`NORTH_STAR_RELEASE_1.md`](./NORTH_STAR_RELEASE_1.md) formam o **framework de métricas congelado** do Release 1.

Não alterar IDs, limiares de gate ou invariantes sem novo ADR / revisão explícita do experimento.  
Maior risco daqui em diante: disciplina de execução (freeze 7 dias, registrar dados, não reinterpretar no meio da janela) — não falta de definição.
