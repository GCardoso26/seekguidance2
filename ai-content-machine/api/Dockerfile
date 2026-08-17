FROM node:22-bookworm-slim
WORKDIR /app/api

# python3/make/g++: better-sqlite3 native build
# ffmpeg/ffprobe: Production Engine (mock voice/visual/compose)
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ ffmpeg \
  && rm -rf /var/lib/apt/lists/*

COPY api/package.json api/package-lock.json* ./
RUN npm install

# Source only — node_modules do host é bloqueado por .dockerignore
COPY api/ ./
COPY db /app/db

# Garante binding nativo contra o Node da imagem (evita libnode.so.XXX / ERR_DLOPEN_FAILED)
RUN npm rebuild better-sqlite3 --build-from-source

ENV CWM_DB_PATH=/data/cwm.sqlite
ENV CWM_ASSETS_PATH=/data/assets
EXPOSE 8787
CMD ["npm", "run", "start"]
