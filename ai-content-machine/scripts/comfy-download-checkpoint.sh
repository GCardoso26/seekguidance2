#!/usr/bin/env bash
# Download a single-file SD 1.5 checkpoint for ComfyUI (not diffusers shards).
# Usage:
#   ./scripts/comfy-download-checkpoint.sh        # v1-5-pruned-emaonly.safetensors (~4 GB)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="${COMFY_MODELS_DIR:-$ROOT/data/comfy/models/checkpoints}"
mkdir -p "$DEST"

if [[ "${1:-}" == "tiny" || "${1:-}" == "tiny-sd" ]]; then
  echo "tiny-sd da Hugging Face é formato Diffusers (vários ficheiros), incompatível com CheckpointLoaderSimple do ComfyUI."
  echo "Para smoke na A1 use o mesmo SD 1.5 com COMFY_WIDTH=384 COMFY_HEIGHT=640 COMFY_STEPS=4 COMFY_WORKFLOW=image_a1_cpu"
fi

url="https://huggingface.co/stable-diffusion-v1-5/stable-diffusion-v1-5/resolve/main/v1-5-pruned-emaonly.safetensors"
out="$DEST/v1-5-pruned-emaonly.safetensors"

if [[ -f "$out" && -s "$out" ]]; then
  echo "already present: $out"
else
  echo "downloading $(basename "$out") → $DEST"
  wget -O "$out.partial" "$url"
  mv "$out.partial" "$out"
fi

ls -lh "$DEST"
echo "Set COMFY_CHECKPOINT=v1-5-pruned-emaonly.safetensors"
echo "Done. Restart: docker compose --profile comfy up -d"
