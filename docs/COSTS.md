# Plano de custos (ordem de grandeza, USD/mês)

> Valores variam por região, tráfego e tamanho do corpus. Use como **planilha inicial**, não como orçamento firmado.

## Infra base (pequena escala)

| Item | Estimativa |
|------|------------|
| Postgres gerenciado (2–4 vCPU, HA) | 150–400 |
| Redis (cache + fila) | 30–80 |
| Kubernetes control plane (managed) | 70–150 |
| Object storage (PDFs) | 10–40 |
| Observabilidade (logs + metrics) | 50–150 |

## LLM + embeddings (variável)

| Cenário | Notas |
|---------|-------|
| 100k perguntas/mês, ~2k tokens saída | centenas a poucos mil USD dependendo do modelo |
| Rerank API | +10–30% sobre retrieval |

## Mitigações

- Cache semântico de perguntas frequentes (Redis).
- Modelos menores para classificação / routing.
- Ollama em cluster dedicado para workloads internas (não usuário final).

## Publicação mobile

- Apple Developer Program: taxa anual fixa.
- Google Play: taxa única de registro.
- **EAS Build** (Expo): plano conforme minutos de build.
