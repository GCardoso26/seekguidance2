# Runtime deployment v2 — EC2

Em produção na EC2, use o compose na **raiz do repositório**:

```
../../docker-compose.production.yml
```

Scripts: `../../../scripts/ec2/start-api.sh`

Documentação: `../../../docs/EC2_PRODUCTION_DEPLOY.md`

O `docker-compose.production.yml` nesta pasta é apenas referência single-node; o deploy completo (API + worker + Redis + RDS) está na raiz.
