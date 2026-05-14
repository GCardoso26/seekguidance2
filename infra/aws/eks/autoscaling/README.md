# Autoscaling (EKS)

## HPA

Aplicar `api/hpa.example.yaml` após metrics-server.

## Cluster Autoscaler

- Tag ASG / node group: `k8s.io/cluster-autoscaler/enabled`, `k8s.io/cluster-autoscaler/<cluster>`.
- IAM policy oficial do Cluster Autoscaler.

## Karpenter (opcional)

Roadmap: políticas de consolidação e limites de custo (`infra/aws/runtime/cost_governance`).
