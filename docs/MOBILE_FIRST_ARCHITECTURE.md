# Arquitectura mobile-first (rollback arquitectural AWS-heavy)

Este documento define a **reorientação incremental**: o produto centra-se no **assistente de juiz em dispositivos móveis** (iOS/Android, tablets, foldables), **offline-aware**, com **sincronização incremental** e **replay interactivo leve**. A **AWS e o EKS** permanecem como **backend opcional** — **não** se apaga `infra/aws/` nem se removem integrações já criadas.

## Rollback arquitectural (não destrutivo)

| Antes (énfase) | Depois (énfase) |
|----------------|-----------------|
| Cloud-centric / EKS como narrativa central | **Edge + mobile runtime** como experiência principal |
| OTEL/Grafana como história obrigatória | Observabilidade **leve no dispositivo**; cloud **opcional** |
| Orquestração distribuída obrigatória | **Modo single-node / local** sempre disponível |

- **Infra AWS**: mantida; papel = **sync provider**, **arquivo de replay**, **observabilidade/analytics** quando activo.
- **Docker Compose** e API FastAPI: **inalterados** como base; novos endpoints **leves** para mobile (ver `services/api/app/api/v1/mobile.py`).

## Pilares

1. **Mobile-first UX** — touch, leitura rápida em torneio, timelines compactas.
2. **Offline-first** — caches locais, filas de sync, continuação determinística de replay.
3. **Runtime leve** — `app/mobile_runtime/` com caps de memória/bateria e *branch compaction* agressivo.
4. **Híbrido** — local para replay/timeline/hints; cloud para datasets massivos, solver pesado, ingestão.

## Stack móvel (preparação)

- **React Native ou Flutter-ready**: pastas em `apps/mobile/` com contratos partilhados documentados; **sem** big rewrite do monorepo web existente.
- **Persistência local**: abstracção preparada para SQLite / Realm / filesystem chunks (stubs Python no servidor documentam payloads).

## Contratos preservados

- Pipelines **V1–V11**, **reasoning_v1…reasoning_v11**, **explainability-first**, **replay determinístico**, **soft normalization**, **lineage/governança** — **sem remoção**.

## Documentação relacionada

- `docs/MOBILE_JUDGE_ASSISTANT_PLATFORM.md` — plataforma, gaps e roadmap.
- `infra/aws/README.md` — AWS como **opcional** explicitamente.
