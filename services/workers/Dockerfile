FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY services/ingestion /ingestion
RUN pip install /ingestion

COPY services/api/requirements.txt /app/requirements.txt
RUN pip install -r /app/requirements.txt

COPY services/workers /app/workers
ENV PYTHONPATH=/app/workers

CMD ["arq", "arq_worker.WorkerSettings"]
