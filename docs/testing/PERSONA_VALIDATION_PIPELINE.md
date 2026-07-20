# Persona Validation Pipeline

Ordem **fixa** de responsabilidades — cada persona uma pergunta, um relatório independente.

Orquestração automática: [QA_ORCHESTRATOR.md](./QA_ORCHESTRATOR.md) (`npm run test:qa:orchestrator`).

```text
Ricardo Menezes (SRE)
        ↓
Smoke
        ↓
Marina Costa (Seller QA)
        ↓
Carlos Henrique (Buyer QA)
        ↓
Fernanda Rocha (Marketplace QA)
        ↓
Juliana Almeida (UX)
        ↓
Eduardo Lima (Search)
        ↓
Daniela Costa (Catalog)
        ↓
Renato Oliveira (Performance)
        ↓
Merge + consolidação
        ↓
Market Review Board (MRB)
```

## Ricardo Menezes — SRE

- **Pergunta:** Por que a plataforma não abriu?
- **Entrega:** Environment Score, Blocking Issues, Warnings, **Ready for Functional QA**
- **Comando:** `npm run test:audit`
- **Nunca** executa login nem fluxo de venda.

## Marina Costa — Seller QA

- **Pergunta:** Consigo vender cartas um dia inteiro?
- **Pré-requisito:** `Ready for Functional QA: YES` + `npm run test:campaign:gates` (audit + smoke)
- **Campanhas:** Curta (20–30 min) → Média (60–90 min) → Longa (2–3 h supervisionada)
- **STOP:** qualquer falha crítica de fluxo — relatório com **Ready To Resume**

## Carlos Henrique — Buyer QA

- **Pergunta:** Encontro oferta, compro e confio no checkout?
- **Pré-requisito:** Marina passou ciclo Lorcana mínimo ou estoque seed em staging autorizado
- **Não** concluir pagamento real em Beta

## Fernanda Rocha — Marketplace QA

- **Pergunta:** Liquidez, ofertas e confiança no marketplace batem com a promessa?
- **Entrega:** notas qualitativas para MRB (Market Learning R5)
- **Não** substitui North Star

## Juliana Almeida — UI/UX Auditor

- **Pergunta:** A experiência de uso está sólida (sem validar regra de negócio)?
- **Foco:** loading, layout, skeleton, CLS, scroll, responsividade, contraste, a11y, labels, filtros, formulários, copy
- **Entrega:** UX Score, Visual Bugs, Loading, Accessibility, Performance percebida, Top 30 melhorias
- **Automação:** parcial (`juliana-ux-audit.mjs`); campanha visual exige browser

## Eduardo Lima — Search Specialist

- **Pergunta:** Search ranqueia, tolera typo, sinônimos, facets e idioma com latência aceitável?
- **Entrega:** Search Score + matriz de queries (Rapunzel, Rap, charizard, black lotus, etc.)
- **Automação:** Vitest (gameConfig, searchProjection) + HTTP opcional

## Daniela Costa — Catalog Specialist

- **Pergunta:** Catálogo por provider está correto antes do marketplace?
- **Foco:** imagem, coleção, idioma, acabamento, raridade, collector number, legality, variantes (foil, RH, enchanted, serialized)
- **Automação:** suítes de provider + validation (API)

## Renato Oliveira — Performance Auditor

- **Pergunta:** Comportamento real sob carga **leve** (não stress)?
- **Carga exemplo:** 100 buscas, 500 PDP, 200 filtros, 100 carrinhos — média, P95, P99
- **Infra:** CPU/RAM no host; Redis/OpenSearch via audit Ricardo
- **Automação:** `renato-performance-audit.mjs` + `performanceBudget.test.ts`

## MRB

- Evidência → decisão → roadmap (não engenharia de feature por default)
- Cursor recebe handoff: `testing/reports/qa-cursor-handoff.md`

## Ready To Resume

Todo relatório STOP deve incluir checklist (gerado automaticamente no audit):

```markdown
- [ ] Runtime Console UP
- [ ] API HEALTHY
...
- [ ] Smoke PASS
↓ Retomar a partir do Login
```

Fonte: `testing/reports/environment-audit-latest.md`
