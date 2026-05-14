# Runtime security (EKS)

- **Pod Security Standards** (restricted/baseline) por namespace.
- **NetworkPolicies**: API só fala com Redis/Postgres e DNS; workers idem + egress S3.
- **Image signing** (Cosign) + admission (Kyverno) — roadmap CI/CD.
