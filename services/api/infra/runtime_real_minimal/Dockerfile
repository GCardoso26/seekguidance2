FROM python:3.12-slim

WORKDIR /app
COPY services/api/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY services/api /app
ENV PYTHONPATH=/app
ENV RUNTIME_DATA_DIR=/data/runtime

VOLUME ["/data/runtime"]
EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
