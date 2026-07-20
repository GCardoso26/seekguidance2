# Provider Lifecycle

**Relaciona:** [ADR-006](./adr/ADR-006-provider-certification.md) · [ADR-012](./adr/ADR-012-lorcana-first-beachhead.md) · [ADR-013](./adr/ADR-013-tcg-expansion-allowlist.md) · [`RELEASE_2_PROVIDER_PROGRESS.md`](./RELEASE_2_PROVIDER_PROGRESS.md) · [`PLATFORM_CONSTITUTION.md`](./PLATFORM_CONSTITUTION.md)

## Stages

```text
Research → Planned → Implemented → Shadow → Canary → Live → Beachhead
```

| Stage | Significado | Sync? | Marketplace? |
|-------|-------------|-------|--------------|
| **Research** | Allowlist futura / mercado em estudo; sem compromisso de Playbook | Não | Não |
| **Planned** | Na allowlist; pronto para Dataset / factory | Não | Não |
| **Implemented** | Código no factory; rollout OFF | Não (default) | Não |
| **Shadow** | Sync sem impacto em busca/market LIVE | Sim | Não |
| **Canary** | % tráfego / subset | Sim | Parcial |
| **Live** | Produção plena do provider | Sim | Sim |
| **Beachhead** | Live + mercado R1 (só Lorcana hoje) | Sim | Sim |

`RolloutMode` (`OFF|SHADOW|CANARY|LIVE`) permanece o mecanismo de feature flag.  
`lifecycle` é a visão operacional derivada (+ flag beachhead).  
**Research** não deriva de rollout — é declarado no portfólio ops (ex.: Riftbound, Naruto).

Transições saltando stages são **proibidas** em código (`canTransitionLifecycle`).

## Novos TCGs

1. Evidência de mercado → **Research** (R4 allowlist pode estar aqui)  
2. Compromisso de engenharia / Playbook → **Planned**  
3. Provider modular + GameConfig → **Implemented**  
4. Certification SHADOW→… → **Live**  
5. Beachhead **nunca** sem novo ADR superseding ADR-012

Código: `services/api/src/catalog/providers/ProviderLifecycle.ts`.
