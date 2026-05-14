# Judge runtime — evolução contínua (vNext)

Plataforma **judge assistant**: corpus executável real (prioridade), formal legality operacional (v4+v5), observabilidade viva, replay governance, explosion control (v4+v5), runtime distribuído, continuous evaluation (v6+v7), hardening cross-TCG (v3+v4), datasets judge-grade (v2+v3), UX operacional e confiança operacional — **incremental**, **explainability-first**, **deterministic replay**, **lineage temporal**, **soft normalization**.

## Corpus executável

Ingestão expandida com `real_execution_corpus`, `historical_judge_runtime`, arquivos de conflito de política, corpus semântico de replay, loops de replacement, paradoxos de timing, replays de disputas multiplayer, casos cross-TCG (análogos fracos), deltas legacy e regressão de ontologia. Métricas de confiança (publisher/judge/replay/contradição/ontologia) e manifests de bundle de replay.

## Formal legality

`formal_solver_v4` mantido; **`formal_solver_v5`** adiciona payloads obrigatórios (`legality_reasoning`, `proof_steps`, `assistant_notes`) sem CNF/SAT bruto, com Z3 incremental assistente, multiplayer bounded, SEGOC/FAB/APNAP, alinhamento solver↔replay e runtime distribuído.

## Replay governance

Mantido em `replay_stability` + integração em `production_runtime`; fingerprints e lineage continuam governáveis.

## Runtime observabilidade

`live_runtime` estende OTEL/Prometheus, tracing v2, diagnósticos de replay/solver, hotspots, custo de ramos, observabilidade de pipelines, drift de ontologia live, observabilidade cross-TCG **comparativa**, workers, tracing de replay distribuído, alertas de regressão, entropia live e governança de custo.

## Explosion control

**`explosion_control_v5`** complementa v4 com colapso preditivo, forecast de entropia, predição de divergência, entropia de ontologia, merge de ramos cross-version, compactação de replay, convergência temporal, pruning adaptativo, caps distribuídos, estabilização de emergência, equivalência fraca de ramos, explosão multiplayer, caps de replacement e pruning de dependências ocultas.

## Distributed runtime / produção

`production_runtime` estende governança distribuída, supervisão v2, backpressure live, orquestração de workers, motor de recuperação, failover determinístico, validação de consistência, recuperação de replay, alinhamento de cache, snapshots semânticos, replay persistente, governança de custo, balanceamento de carga, scaling adaptativo, estratégias de degradação e confiança de runtime.

## Continuous evaluation

**`continuous_v7`** mede consistência judge-grade, regressões cross-TCG soft, precisão do solver, legalidade temporal, tendências de drift de ontologia, estabilidade de replay, consistência de runtime, legalidade multiplayer, replacement, alinhamento determinístico, discordância humana, precisão cross-version, divergência semântica, precisão vs explosion e confiança operacional.

## Hardening cross-TCG

**`hardening_v4`** adiciona runtimes competitivos YGO, camadas MTG, FAB, Pokémon, One Piece, Digimon, Lorcana, Riftbound e pacote de diagnósticos — sempre **soft normalization**.

## Judge-grade datasets v3

`evaluation/judge_grade_datasets_v3` com manifest stub, schema e registry; estende snapshots e metadados de drift/divergência de ramos.

## UX operacional

HTML modulares em `apps/` (proof viewer, branch diff, multiplayer, deterministic runtime, drift timeline, SEGOC/combat chain/replacement/hidden deps, consolas de runtime e dispute, torneio live/investigação/arquivo, treino runtime).

## Gaps honestos

Corpus «real massivo» ainda requer ingestão curada; OTEL/Prometheus são fragmentos; Z3 «real» mantém-se atrás de orçamentos e stubs honestos.

## Próximos passos

1. Ligar scrape/snippet a serviços reais.
2. Persistir manifests v3 em CI judge-grade.
3. Expandir `real_execution_corpus` com PDFs e rulings auditados.
