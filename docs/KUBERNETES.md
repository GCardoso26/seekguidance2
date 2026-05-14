# Kubernetes (referência mínima)

## Checklist

- [ ] Namespace `tcg-judge`
- [ ] Secrets: `DATABASE_URL`, `REDIS_URL`, chaves LLM
- [ ] Deployment `api` (replicas ≥ 2)
- [ ] Service + Ingress (TLS)
- [ ] StatefulSet ou managed Postgres (recomendado)
- [ ] CronJob `ingestion-scheduler`

## Exemplo (trecho)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: tcg-judge-api
spec:
  replicas: 2
  selector:
    matchLabels:
      app: tcg-judge-api
  template:
    metadata:
      labels:
        app: tcg-judge-api
    spec:
      containers:
        - name: api
          image: ghcr.io/example/tcg-judge-api:latest
          ports:
            - containerPort: 8000
          envFrom:
            - secretRef:
                name: tcg-judge-secrets
          readinessProbe:
            httpGet:
              path: /v1/health
              port: 8000
```

Manifests completos podem evoluir a partir do `docker-compose.yml` (mesmas variáveis).
