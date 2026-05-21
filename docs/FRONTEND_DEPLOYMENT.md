# Frontend — Runtime Console v3

Produção recomendada na EC2 com domínio **https://judgetcg.com.br**.

Guia completo (DNS, Caddy, HTTPS, systemd): **[DOMAIN_JUDGETCG.md](./DOMAIN_JUDGETCG.md)**

## Comandos rápidos (EC2)

```bash
cd ~/seekguidance2
git pull
bash scripts/ec2/setup-domain-judgetcg.sh
```

Desenvolvimento local (sem TLS):

```bash
cd frontend/runtime_console_v3
npm install
npm run dev
```

Judge: `/judge` — ver [JUDGE_FRONTEND_UI.md](./JUDGE_FRONTEND_UI.md).
