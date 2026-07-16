# ADR-006 — Provider Certification

**Status:** Accepted  
**Data:** 2026-07-16  
**Tags:** providers, rollout, certification

## Context

Cada novo TCG/provider (Pokémon, YGO, Bandai, …) tende a virar exceção se entrar sem checklist comum.

## Decision

Nenhum provider novo em produção sem passar por [`PROVIDER_CERTIFICATION.md`](../PROVIDER_CERTIFICATION.md):

Capabilities · erros · rate limit · retry · dedup · reconciliação de mappings · rollout OFF→SHADOW→CANARY→LIVE · observabilidade.

Piloto **Scryfall** deve completar ciclo estável (SHADOW→CANARY→LIVE) **antes** de outros providers.

## Consequences

- Feature flags e Registry modes são o mecanismo de rollout.
- Exceções exigem ADR de supersede — não “só desta vez”.
