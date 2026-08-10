FROM node:22-bookworm-slim
WORKDIR /app/api
# python3/make/g++: better-sqlite3 native build; ffmpeg/ffprobe: Production Engine (mock voice/visual/compose)
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ ffmpeg \
  && rm -rf /var/lib/apt/lists/*
COPY api/package.json api/package-lock.json* ./
RUN npm install
COPY api/ ./
COPY db /app/db
ENV CWM_DB_PATH=/data/cwm.sqlite
EXPOSE 8787
CMD ["npm", "run", "start"]
