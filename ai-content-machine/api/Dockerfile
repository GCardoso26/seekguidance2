FROM node:22-bookworm-slim
WORKDIR /app/api
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY api/package.json api/package-lock.json* ./
RUN npm install
COPY api/ ./
COPY db /app/db
ENV CWM_DB_PATH=/data/cwm.sqlite
EXPOSE 8787
CMD ["npm", "run", "start"]
