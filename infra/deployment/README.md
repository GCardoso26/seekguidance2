# Deployment

Helm/Kubernetes completos ficam fora deste repositório ou evoluem em `infra/k8s/`.

Práticas recomendadas:

- rolling + readiness/liveness;
- secrets via SecretStore CSI;
- workers separados da API;
- GPU node pools apenas para rerank/embed batch.
