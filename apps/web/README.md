# JudgeTCG Web (Sprint 7.1)

Fundação frontend: auth JWT/refresh, clients tipados, rotas protegidas.

```bash
# API (memória) — porta 8789
cd ../../services/api && npm run api:auth

# App
npm run dev
```

Testes:

```bash
npm test
npm run test:e2e
```

Detalhes: [docs/SPRINT_7_1.md](./docs/SPRINT_7_1.md) · [docs/SPRINT_7_2.md](./docs/SPRINT_7_2.md)

Buyer local stack:

```bash
# em services/api
npm run api:public        # :8787 search/cards/variants
npm run api:auth          # :8789 auth + marketplace R/W
```

Seller (7.3) + Checkout (7.4):

```bash
# Identity + Marketplace + Cart/Checkout na mesma porta
AUTH_API_PORT=8789 npm run api:checkout
npm run api:public   # :8787 search/cards
```

Detalhes: [7.1](./docs/SPRINT_7_1.md) · [7.2](./docs/SPRINT_7_2.md) · [7.3](./docs/SPRINT_7_3.md) · [7.4](./docs/SPRINT_7_4.md) · [DoD](./docs/SPRINT_7_COMPLETE.md)
