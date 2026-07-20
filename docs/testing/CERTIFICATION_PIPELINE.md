# Certification Pipeline (pós-R4 — visão)

**Não** é release de produto. É **processo previsível** antes de homologação.

```text
Infrastructure Certification     ← Ricardo / Environment Audit
        ↓
Functional Certification       ← Smoke + gates HTTP
        ↓
Seller Certification           ← Marina (publish, estoque, 100+ listings)
        ↓
Buyer Certification            ← Carlos (search, cart, checkout até sessão)
        ↓
Marketplace Certification      ← ofertas, PDP, separação catalog/marketplace
        ↓
Release Certification          ← MRB + North Star evidência (Beta real)
```

## Regra

Um release só é **candidato à homologação** quando a certificação **anterior** está verde.

| Estágio | Gate automático hoje | Persona |
| --- | --- | --- |
| Infrastructure | `npm run test:audit` | Ricardo |
| Functional | `npm run test:campaign:gates` | Ricardo + smoke |
| Seller | Playwright/personas + campanha Marina | Marina |
| Buyer | Campanha Carlos | Carlos |
| Marketplace | ADR-003 overlay + testes domínio | Eng + QA |
| Release | MRB + Founder Report | Ops |

## North Star

LPC/LCS/SD **não** são gerados por certification CI. Só Beta real (ADR-014).

## Evolução

Consolidar JSON de cada estágio em `testing/reports/certification-*.json` versionáveis no CI — sem dashboard React.

Relaciona: [ENVIRONMENT_AUDIT.md](./ENVIRONMENT_AUDIT.md) · [Platform Constitution](../architecture/PLATFORM_CONSTITUTION.md)
