# ComfyUI na VPS A1 vs ponte com o PC

Objectivo: **provar** se a `VM.Standard.A1.Flex` (Ampere ARM, CPU, sem GPU) consegue gerar imagens no MISS da Asset Library, ou se o caminho publicável precisa de uma GPU no PC nativo.

Sem Wan/LTX. Só image generation (`/prompt` → `/history` → `/view`).

## Decisão

| Resultado do benchmark | Acção |
|------------------------|--------|
| A1 gera PNG válido (< 15 min/cena, `visualProvider=comfyui`, pacote `READY_FOR_PUBLISH`) | Manter Comfy na VPS (`--profile comfy`) |
| Timeout / OOM / imagens inválidas / fallback `mock_visual` | Ponte SSH/Tailscale para ComfyUI **GPU no PC** |

`mock_visual` **nunca** autoriza YouTube. A fábrica ainda completa o MP4 (Ken Burns) e deixa o pacote em `READY_FOR_REVIEW`.

## Topologias (mesma API)

```
Library HIT → reuse
Library MISS → ComfyUI → validate PNG → catalog GENERATED
                 ↓ timeout / erro / NOT_CONFIGURED
               Mock visual → compose → MP4 → READY_FOR_REVIEW (não publicável)
```

### A — Comfy no compose da A1 (CPU)

```bash
# Na VM, em ai-content-machine/
./scripts/comfy-download-checkpoint.sh
# Smoke A1: COMFY_WIDTH=384 COMFY_HEIGHT=640 COMFY_STEPS=4 COMFY_WORKFLOW=image_a1_cpu

# .env
COMFY_BASE_URL=http://comfy:8188
COMFY_WORKFLOW=image_a1_cpu
COMFY_TIMEOUT_MS=900000
COMFY_POLL_MS=3000
COMFY_CHECKPOINT=v1-5-pruned-emaonly.safetensors
COMFY_WIDTH=512
COMFY_HEIGHT=768
COMFY_STEPS=4

docker compose --profile comfy up -d --build
```

Porta **8188 só em 127.0.0.1**. Não abrir no NSG/Security List da OCI (igual a `:11434` / `:8880`).

RAM: A1 com **12 GB**. Não corra Ollama+Kokoro+Comfy no mesmo segundo em 6 GB.

### B — Ponte GPU no PC (recomendado se A falhar)

No PC, ComfyUI na GPU a escutar `127.0.0.1:8188`.

Reverse tunnel a partir do PC (fica em **loopback da VPS**):

```bash
ssh -N -R 8188:127.0.0.1:8188 ubuntu@164.152.28.87
```

O `host.docker.internal` do compose é o gateway Docker (`172.17.0.1`), **não** o `127.0.0.1` da VPS. Sem o DNAT abaixo a API não vê o túnel:

```bash
# Na VPS, com o túnel já aberto
./scripts/comfy-expose-to-docker.sh
```

No `.env` da API (compose **sem** profile `comfy`):

```
COMFY_BASE_URL=http://host.docker.internal:8188
COMFY_WORKFLOW=image_cinematic
COMFY_TIMEOUT_MS=180000
COMFY_CHECKPOINT=v1-5-pruned-emaonly.safetensors
```

`extra_hosts: host.docker.internal:host-gateway` já está no serviço `api`.

Tailscale: `COMFY_BASE_URL=http://<tailscale-ip>:8188` — o container precisa de alcançar esse IP (egress allow-list / UFW).

## Bateria de comparação (mesma idea)

Repetir **n=3** na A1 CPU e n=3 na ponte GPU, com a **mesma idea / script aprovado** (`regenerate: true`).

Anotar de `factoryMetrics` + Detalhe da production:

| Campo | Onde |
|-------|------|
| `visualsMs` | `factoryMetrics.visualsMs` |
| `visualProvider` | `comfyui` vs `mock_visual` |
| `fallbackCount` | trail Comfy TIMEOUT/ERROR |
| `packageStatus` | tem de ser `READY_FOR_PUBLISH` para publicar |
| `mp4Bytes` | tamanho do Short |
| `GET /api/factory/status` → `visual.comfyProbe` | READY + latencyMs |

Critério de sucesso A1: 3/3 cenas `provider=comfyui`, PNG com magic válido, `visualsPublishable=true`, gate 5.1 dry-run `packageOk=true` (OAuth à parte).

Critério de falha: qualquer cena `mock_visual` → **não publicar**; usar ponte B.

## Health

`GET /api/factory/status` faz ping real a `/system_stats` (timeout 5 s).  
`COMFY_BASE_URL` setado mas Comfy morto → `visual.comfy=ERROR` (não mente READY). Generate falha rápido e cai no Mock.

## Kill switches

Não mexer em `OLLAMA_*` / `KOKORO_*`. Defaults de publish: `DRY_RUN=true`, `PUBLISHING_ENABLED=false`, kill switch on.
