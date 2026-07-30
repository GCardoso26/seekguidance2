# ADR-017 — Object Storage Próprio para a Asset Platform

**Status:** Accepted
**Data:** 2026-07-30
**Tags:** assets, media, storage, cdn, infrastructure
**Relaciona:** [ADR-002](./ADR-002-bullmq-commands-only.md) · [ADR-015](./ADR-015-architecture-freeze-product-first.md) · [ADR-016](./ADR-016-tcg-hard-exit-and-packshot-allowlist.md) · [RFC-0002](../../rfcs/RFC-0002-object-storage-asset-platform.md)
**Supersedes:** nada. Complementa ADR-015 autorizando **uma** exceção delimitada ao freeze.

## Context

ADR-015 congela componentes transversais novos sem RFC e ADR. [RFC-0002](../../rfcs/RFC-0002-object-storage-asset-platform.md) apresenta a evidência que justifica a exceção:

- A Asset Platform, listada no ADR-015 como fundação **concluída**, grava `storage_key` e 18 URLs derivadas por asset sem nunca enviar um byte. As derivadas persistidas retornam **403** — verificado por HEAD em 2026-07-30.
- 14% dos packshots selados respondem 403 na origem TCGplayer, em todas as resoluções e com qualquer User-Agent. A disponibilidade da imagem do catálogo é decidida por terceiro.
- A recomendação de reingerir para CDN próprio já constava de [`SEALED_PRODUCT_IMAGE_PROVIDERS.md`](../../SEALED_PRODUCT_IMAGE_PROVIDERS.md) e nunca foi implementada.

Problema **observado**, não imaginado: existe hoje, no banco de produção, metadado que aponta para objeto inexistente.

## Decision

### 1. Autorizar object storage próprio para mídia

Cloudflare R2, S3-compatível, servido por `cdn.judgetcg.com.br` (a zona na conta Cloudflare é a `.com.br`). Escopo restrito a **mídia de catálogo**. Não é storage de propósito geral e não substitui Postgres para dado estruturado.

### 2. O pipeline de asset é: download, otimizar, upload, persistir

Nenhuma etapa pode ser pulada silenciosamente. Persistir `storage_key` ou `cdn_url` para objeto que não foi enviado é **defeito**, não estado intermediário aceitável.

### 3. `derivatives` só lista objeto que existe

Proibido derivar URL por concatenação de sufixo sobre host de terceiro. Cada entrada de `media.assets.derivatives` corresponde a um objeto enviado. É a mesma regra de ouro do ADR-016 aplicada a derivadas: preferir ausência a URL falsa.

### 4. Acesso a storage só por porta

`ObjectStoragePort`, com `NoopObjectStorage` como default. Dev, CI e teste rodam sem credencial e sem rede. Nenhum código de domínio importa SDK de storage direto.

### 5. Formatos e resoluções congelados

Quatro resoluções de produto (240, 420, 800, 1200) em AVIF e WebP, mais o original preservado como fonte de regeneração. Ampliar esse conjunto exige nova decisão — é o vetor óbvio de inflação de custo.

## Non-goals

- Não é CDN para upload de usuário (foto de vendedor, avatar) — decisão separada quando houver demanda.
- Não implementar transformação sob demanda (`/cdn-cgi/image`, resize on the fly) nesta rodada.
- Não migrar assets de carta (Scryfall e afins) junto: o recorte é selado e acessório, onde está o dano medido.
- Não reabrir ADR-015 nem ampliar o precedente: esta ADR autoriza **um** componente, com escopo escrito.

## Consequences

### Altera

- `services/api` ganha duas dependências: `sharp` (nativa) e `@aws-sdk/client-s3`. Os Dockerfiles de worker precisam suportar o binário nativo.
- `PRODUCT_CATALOG_R2_PUBLIC_BASE` passa a ser env de corte com pré-requisito: só pode ser ligada **depois** do backfill de reprocessamento, sob pena de sobrescrever `cdn_url` funcionando por URL vazia.
- Novas envs: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`.
- `cdn.judgetcg.com.br` já é coberto por `**.judgetcg.com.br` em `remotePatterns`; o CSP `img-src` aceita `https:`.

### Não altera

- ADR-002: o processamento continua em job BullMQ, sem bus novo.
- ADR-011: nenhuma fronteira de API pública muda.
- Schema `media`: `assets`, `asset_links` e `asset_versions` seguem como estão.
- North Star R1 e a ordem de liquidez do ADR-013.

## Future

Ampliar resoluções, formatos ou o escopo do bucket (upload de usuário, transformação sob demanda) exige nova ADR. Se o custo de armazenamento passar de 20 GB, revisar a política de preservar o original.
