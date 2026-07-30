# RFC-0002 — Object storage próprio para a Asset Platform

**Status:** Accepted
**Autor:** Platform Guardian
**Data:** 2026-07-30
**ADRs relacionados:** [ADR-015](../architecture/adr/ADR-015-architecture-freeze-product-first.md) (freeze transversal) · [ADR-016](../architecture/adr/ADR-016-tcg-hard-exit-and-packshot-allowlist.md) (regra de ouro de packshot) · [ADR-002](../architecture/adr/ADR-002-bullmq-commands-only.md) (comandos via BullMQ)

## Problema observado

Medições reprodutíveis em 2026-07-30, sobre o banco de produção e o CDN do TCGplayer:

1. **A Asset Platform declara um contrato que não cumpre.** `AssetMediaPipeline` calcula `storageKey`, grava `media.assets.storage_key` e monta um mapa de 18 URLs derivadas por asset (6 tamanhos × 3 formatos). Nenhum byte é enviado para lugar nenhum. Não existe `@aws-sdk/client-s3`, `sharp`, credencial de bucket ou chamada de upload em todo o repositório.

2. **As URLs derivadas persistidas retornam 403.** Verificado por HEAD:

   | URL | Status |
   |-----|--------|
   | `…/product/704886_in_1000x1000.jpg` | 200 |
   | `…/product/704886_in_1000x1000_thumb.jpg` | 403 |
   | `…/product/704886_in_1000x1000_md.webp` | 403 |

   O "CDN inteligente V2" é metadado apontando para objetos inexistentes. Só a `cdn_url` base funciona, e ela é hotlink de terceiro.

3. **A disponibilidade da imagem é decidida por terceiro.** 14% dos packshots selados respondem 403 no CDN do TCGplayer (69 de 494 numa carga real). O 403 é por produto, não por resolução: `_in_1000x1000`, `_400w` e `_200w` falham igual, com User-Agent de bot e de navegador. Não há mitigação possível do nosso lado enquanto a origem for deles.

4. **Risco de continuidade.** Qualquer mudança de indexação, de política de hotlink ou de ToS no TCGplayer apaga simultaneamente a imagem de todo o catálogo de selados. Hoje são 802 assets; no recorte 2024+ seriam ~4 mil.

O ponto 3 do próprio [docs/SEALED_PRODUCT_IMAGE_PROVIDERS.md](../SEALED_PRODUCT_IMAGE_PROVIDERS.md) já recomendava reingerir para CDN próprio "evitando hotlink direto ao TCGplayer em produção". A recomendação nunca foi implementada.

## Alternativas consideradas

1. **Manter hotlink e apenas parar de gravar derivadas falsas.** Resolve a mentira no banco com uma linha, mas mantém a dependência total de terceiro e desiste de AVIF/WebP/responsivo. Custo zero, teto baixo.

2. **Allowlist de hosts no `next.config.mjs` e otimizar no Next.** O `next/image` otimizaria sob demanda. Move o custo para o runtime do frontend, continua buscando o original no TCGplayer a cada revalidação e não protege contra o desaparecimento da origem.

3. **Supabase Storage.** Projeto já existe, uma dependência a menos. Porém o egress conta na cota do plano e o mesmo Postgres já teve incidente de disco cheio (AUDIT-003); acoplar mídia ao mesmo fornecedor concentra risco.

4. **Cloudflare R2 com CDN próprio (proposta).** Egress zero, S3-compatível, domínio `cdn.judgetcg.com` sob nosso controle. Custa uma dependência nativa (`sharp`) e credenciais novas.

## Proposta

Completar o pipeline que já existe, na ordem que ele já declara: **download → otimizar → upload → persistir**.

```text
Provider → Job → Download → Virus scan → SHA-256 → Dedupe
                                                      ↓
        cdn.judgetcg.com ← Upload R2 ← WebP/AVIF ← Resize
```

- **Porta hexagonal** `ObjectStoragePort` com `R2ObjectStorage` e `NoopObjectStorage`. O default é `Noop`, então dev e CI continuam sem rede e sem credencial.
- **Otimização** com `sharp`: quatro resoluções de produto (240, 420, 800, 1200) em AVIF e WebP, original preservado como fonte de regeneração. Nove objetos por asset.
- **`derivatives` passa a listar apenas objetos efetivamente enviados.** Nada de URL construída por concatenação sobre host de terceiro.
- **Sem novo bus, schema ou Bounded Context.** Usa o BullMQ existente (ADR-002), o schema `media` existente e o versionamento `media.asset_versions` existente.

## Impacto em BCs / Public API

Nenhuma fronteira pública muda. `media.assets.cdn_url` e `derivatives` já são consumidos por Marketplace, Portal e Knowledge; passam a apontar para domínio próprio com o mesmo formato de contrato. `AssetService.ingest` mantém a assinatura.

## Riscos e rollback

| Risco | Mitigação |
|-------|-----------|
| Ligar a env antes do backfill sobrescreve `cdn_url` bom por URL vazia (`COALESCE` pega o EXCLUDED não-nulo) | Ligar `PRODUCT_CATALOG_R2_PUBLIC_BASE` só após o reprocessamento dos assets existentes concluir |
| `sharp` é binário nativo e quebra imagem Docker | Validar build dos workers antes do merge; sem `sharp` disponível o pipeline degrada para original sem derivadas |
| Custo de armazenamento cresce por asset | Medido em 196 KB por asset (4,75 objetos; sem upscale a fonte de 716×1000 só rende as larguras 240 e 420): 0,45 GB no recorte 2024+, 1,11 GB no catálogo completo e ~2,5 GB somando os assets que já existem. Cabe nos 10 GB gratuitos com margem de 4×; R2 não cobra egress |
| Credencial vazada dá escrita no bucket | Token R2 restrito a um bucket, sem permissão de delete; segredo só em Render |

**Rollback:** remover `PRODUCT_CATALOG_R2_PUBLIC_BASE`. O pipeline volta a gravar a URL de origem e o `NoopObjectStorage` assume. Os objetos já enviados ficam órfãos no bucket, sem impacto em runtime.

## Plano de implementação

1. `ObjectStoragePort` + `R2ObjectStorage` + `NoopObjectStorage`, com testes usando o Noop.
2. `sharp` no `AssetMediaPipeline`, gerando derivadas reais e preenchendo `width`/`height` (hoje sempre nulos).
3. Backfill de reprocessamento dos assets existentes.
4. `cdn.judgetcg.com` em `remotePatterns` e no CSP `img-src` do frontend.
5. Ligar a env em produção e validar HTTP 200 nas derivadas.

## Critérios de aceite

- Toda URL em `media.assets.derivatives` resolve HTTP 200.
- Nenhuma URL derivada aponta para host de terceiro.
- `width` e `height` preenchidos nos assets reprocessados.
- Sem credencial R2, a suíte de testes passa integralmente.
- Marketplace renderiza imagem de selado sem requisição a `tcgplayer-cdn.tcgplayer.com`.
