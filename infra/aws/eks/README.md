# EKS — Kubernetes (TCG Judge)

## Namespaces

Ver `namespaces.yaml`: `api`, `workers`, `replay`, `observability`, `evaluation`, `ingestion`.

## Manifestos exemplo

- `api/deployment.example.yaml` — API com probes e limites (sem GPU).
- `api/hpa.example.yaml` — HPA CPU/memória.
- `api/pdb.example.yaml` — PDB para rolling updates seguros.

## Helm

`helm/tcg-judge-api/` — chart mínimo; `values.yaml` define réplicas, recursos e **nodeSelector GPU opcional** (`gpu.enabled: false` por defeito).

## Autoscaling

- **HPA**: métricas CPU/memória (metrics-server).
- **Cluster Autoscaler**: IAM role + tags nas node groups (documentado em `autoscaling/README.md`).

## Ingress

`ingress/README.md` — ALB Controller (AWS Load Balancer Controller) ou NGINX; TLS via ACM.
