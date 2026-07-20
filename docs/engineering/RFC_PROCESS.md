# RFC Process — JudgeTCG

**Status:** Em vigor (ADR-015)  
**Objetivo:** Evitar divergência arquitetural e feature creep em infraestrutura

## Quando é obrigatório

RFC **antes** de código quando a mudança:

- cria ou remove Bounded Context / schema / fila transversal;
- altera contrato público entre BCs;
- introduz componente de plataforma (novo bus, store, mesh, etc.);
- muda estratégia de Outbox, Saga, Events ou Idempotência;
- afeta multi-tenant / segurança / dados pessoais de forma estrutural.

RFC **não** é necessária para:

- features de negócio dentro de um BC já aprovado (ex.: cupom simples no Checkout), desde que respeitem Public API + ADRs;
- hotfixes com escopo mínimo (ainda exigem DoD proporcional).

## Fluxo

```text
RFC (proposta)
    ↓
Discussão (review / sync)
    ↓
ADR (se estrutural) — Accepted
    ↓
Implementação
    ↓
Testes + Architecture tests
    ↓
Deploy (Release Train)
```

## Template RFC

Criar em `docs/rfcs/RFC-NNNN-titulo-kebab.md`:

```markdown
# RFC-NNNN — Título

**Status:** Draft | Accepted | Rejected | Superseded  
**Autor:**  
**Data:**  
**ADRs relacionados:**  

## Problema observado
(evidência — não imaginado)

## Alternativas consideradas
1. …
2. …

## Proposta
…

## Impacto em BCs / Public API
…

## Riscos e rollback
…

## Plano de implementação
…

## Critérios de aceite
…
```

## Numeração

Próximo número disponível após inspeção de `docs/rfcs/`. Começar em **RFC-0001** se pasta vazia.
