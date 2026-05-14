# Plataforma judge assistant mobile-first

## Visão

O TCG Judge evolui para **assistente de juiz em campo**: baixa latência perceptível, **modo offline** útil, **replay** segmentado e **sync incremental** com a cloud apenas quando disponível e desejável.

## Rollback da estratégia AWS-heavy

- **Não** se eliminam contas, clusters, buckets ou repositórios ECR existentes.
- **Sim** há **despriorização narrativa e de produto**: EKS/autoscaling pesado/OTEL enterprise **deixam de ser o centro**; passam a **caminhos opcionais** de adopção (`infra/aws/` mantém-se).
- **Runtime preferido**: `local` + `app/mobile_runtime/` + API **enxuta** (`/v1/mobile/...`).

## Runtime híbrido

| Modo | Onde corre | Funções |
|------|------------|---------|
| `offline` | Dispositivo | Replay local, timeline, caches, hints compactos |
| `hybrid` | Dispositivo + cloud opcional | Delta sync, arquivo, solver pesado sob demanda |
| `cloud` | Cloud opcional | Datasets, ingestão massiva, observabilidade central |

Implementação de referência (stubs): `app/mobile_runtime/runtime_modes/`.

## Replay mobile

- *Chunk loading*, *lazy timeline*, *deterministic resume* — `app/mobile_runtime/replay/`.
- Governança global continua em `app/runtime/replay_governance_v2/`; **ligações móveis** sem duplicar política.

## Offline-first

- `app/mobile_runtime/offline/`, `local_storage/`, `mobile_sync/` — caches, filas, reconciliação e *delayed upload*.

## API leve

- Rotas em `services/api/app/api/v1/mobile.py` (`/v1/mobile/...`) — payloads **explainability-first**, baixa largura de banda, sem acoplamento a EKS.
- Ponteiros: `services/api/mobile_sync/README.md` e `services/api/mobile_auth/README.md` (código de rotas em `app/api/v1/mobile.py`).

## `app/offline_runtime/` (offline-first)

- Replay parcial, merge determinístico assistido, snapshots e degradação controlada.
- Payloads incluem `offline_limitations`, `sync_conflicts`, `replay_alignment` além do núcleo explainability-first.

## `app/mobile_security/`

- Identidade de dispositivo, validação de sessão offline, assinaturas de replay e detecção de adulteração — complementam governança sem substituir o núcleo.

## `app/observability/live_runtime/mobile_*.py`

- Métricas agregadas, sync, replay, custo, bateria, latência, offline e hotspots — **sem** dependência exclusiva de Prometheus/Grafana.

## Datasets judge-grade v4 (mobile)

- Subpacotes em `evaluation/judge_grade_datasets_v4/mobile_*` e `offline_dataset_snapshots/` — perfis compactos, integridade e sync incremental.

## Hardening cross-TCG (mobile-aware)

- `app/games/hardening_v5/mobile_edge_cross_tcg_hints.py` — envolve runtimes **existentes** por TCG com camada `mobile_edge` (**sem** equivalência forte entre TCGs).

## UX

- HTML modular em `apps/mobile/mobile_replay_viewer/` (protótipos touch-first); shell RN em `apps/mobile/react_native/`.
- Apps web `apps/judge_replay/` **mantêm-se**; mobile-native não é apenas WebView monolítica.

## Gaps honestos

- Cliente RN/Flutter **não** está completo — há preparação de pastas e contratos.
- **SQLite/Realm** — apenas caminhos documentados e stubs de servidor que guiam payloads.
- **Auth** (Firebase/Cognito/custom JWT) — opcional; hooks documentados.

## Roadmap curto

1. Completar SDK mobile com sync incremental real.
2. Ligar `mobile_sync` a filas Redis/SQS **opcionais**.
3. Testes de propriedade em *resume* determinístico de replay em dispositivos fracos.
