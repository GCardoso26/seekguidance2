# CPU-only ComfyUI — image generation for CWM (no Wan/LTX/video).
# Builds on linux/amd64 (PC) and linux/arm64 (OCI A1 Ampere).
FROM python:3.11-slim-bookworm

RUN apt-get update \
  && apt-get install -y --no-install-recommends git wget ca-certificates libgl1 libglib2.0-0 \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /opt/ComfyUI

# Prefer a tagged release; fall back to default branch if the tag is missing.
ARG COMFY_REF=v0.3.40
RUN git clone --depth 1 --branch "${COMFY_REF}" https://github.com/comfyanonymous/ComfyUI.git . \
  || git clone --depth 1 https://github.com/comfyanonymous/ComfyUI.git .

RUN pip install --no-cache-dir --upgrade pip \
  && pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu \
  && pip install --no-cache-dir -r requirements.txt \
  && (pip uninstall -y torchaudio || true)

# CWM só gera imagens — torchaudio no PyPI puxa libs CUDA (libcudart) e rebenta
# nodes_audio.py na A1 CPU. Sem áudio o ComfyUI arranca na mesma (IMPORT FAILED ok).

# ComfyUI v0.3.40 does `import requests` in app/frontend_management.py but does not
# list it in requirements.txt. Newer huggingface_hub no longer pulls it transitively.
# Separate layer so the torch/requirements cache on the VPS stays valid.
RUN pip install --no-cache-dir requests typing_extensions \
  && python -c "import requests; import app.frontend_management"

RUN mkdir -p /opt/ComfyUI/models/checkpoints /opt/ComfyUI/output /opt/ComfyUI/input

EXPOSE 8188
ENV CLI_ARGS="--listen 0.0.0.0 --port 8188 --cpu"

HEALTHCHECK --interval=30s --timeout=10s --start-period=180s --retries=12 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8188/system_stats', timeout=5)"

# Bind 0.0.0.0 inside the container; compose publishes 127.0.0.1:8188 only.
CMD ["sh", "-c", "python main.py $CLI_ARGS"]
