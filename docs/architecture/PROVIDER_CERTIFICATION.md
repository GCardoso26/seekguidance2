# Provider Certification — checklist (pós-piloto Scryfall LIVE)

**Status:** Rascunho de gate — **não** adicionar Pokémon / YGO / Bandai antes deste checklist.  
**Pré-requisito:** Scryfall estável em LIVE + validação de consistência.

Todo novo Catalog/Pricing provider deve passar por este documento antes de produção.

## 1. Capabilities

- [ ] Capabilities declaradas no Provider Registry (cards, sets, variants, images, legality, rulings, prices, …)
- [ ] Gaps conhecidos documentados (o que o provider **não** faz)
- [ ] Contrato de DTOs alinhado aos ports de domínio

## 2. Confiabilidade

- [ ] Taxa de erro aceitável definida (ex.: < 1% em SHADOW sobre N syncs)
- [ ] Limites de API conhecidos (RPM, burst, quotas diárias)
- [ ] Estratégia de retry (exponencial, jitter, max attempts)
- [ ] Estratégia de rate limiting (token bucket / concurrency)
- [ ] Classificação de erros: transitório vs poison (→ `dead` imediato)

## 3. Dados

- [ ] Estratégia de deduplicação (provider ids + `provider_mappings`)
- [ ] Estratégia de reconciliação de mappings (remap / orphan / merge)
- [ ] Upsert Policy do domínio respeitada (imutável / atualizável / evento)
- [ ] Sem escrita no Catalog fora de Application Service + Outbox

## 4. Rollout

```text
OFF → SHADOW → CANARY → LIVE
```

- [ ] SHADOW: sync sem impacto em Search/Marketplace (ou shadow index)
- [ ] CANARY: % tráfego / subset de sets
- [ ] LIVE: critérios de promoção + plano de rollback
- [ ] Feature flags por provider/game

## 5. Observabilidade

- [ ] Métricas: duration, cards/sets sync, errors, queue depth, outbox lag
- [ ] Logs com `requestId` / `correlationId` / `providerId` / `gameCode`
- [ ] Health no Registry (`success_rate`, `lastSuccessAt`, `lastError`)

## 6. Operação

- [ ] Runbook de reprocessamento (`dead` → `pending`)
- [ ] Contato / SLA do provider externo
- [ ] Custo estimado (Registry cost) aceito

---

**Gate:** nenhum novo jogo/provider em produção sem este checklist assinado (eng + ops).
