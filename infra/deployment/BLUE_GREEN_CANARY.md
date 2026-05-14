# Deployment (blue/green, canary)

Este repositório não impõe um cloud provider. Padrões recomendados:

- **Blue/green**: duas revisões da API com mesmo Postgres; cutover via LB após health + smoke `pytest -m judge_grade`.
- **Canary**: percentagem de tráfego para revisão nova; comparar métricas de erro e latência.
- **Rollback de replay**: reverter deployment + invalidar caches semânticos; revalidar hashes (`replay_validation`).

Helm/Kustomize podem ser adicionados incrementalmente sem alterar imagens existentes.
