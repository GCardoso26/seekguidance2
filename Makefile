.PHONY: help lint test integration-test e2e ingest-mtg worker reindex ask install-api install-ingestion install-rerank install-dev

help:
	@echo "Targets: install-api install-ingestion install-dev install-rerank lint test integration-test e2e ingest-mtg worker reindex ask"
	@echo "integration-test: precisa Docker; em Unix use RUN_INTEGRATION=1 (ver alvo)."

install-ingestion:
	cd services/api && pip install -e ../ingestion

install-api: install-ingestion
	cd services/api && pip install -r requirements.txt

install-dev: install-api
	cd services/api && pip install -r requirements-dev.txt

install-rerank:
	pip install "sentence-transformers>=3.3.0,<4"

lint:
	cd services/api && ruff check app tests

test:
	cd services/api && pytest -q -m "not integration and not e2e"

integration-test:
	cd services/api && pip install -r requirements-dev.txt && RUN_INTEGRATION=1 pytest -q -m integration

e2e:
	cd services/api && pytest -q -m e2e

ingest-mtg:
	cd services/api && python ../../scripts/ingest_mtg.py --game mtg

worker:
	docker compose -f docker-compose.yml up worker

reindex:
	@echo "Stub: enfileirar reindex_worker via arq (ver services/workers/arq_worker.py)."

ask:
	@echo "Exemplo curl:"
	@echo "curl -s -X POST http://localhost:8000/v1/chat/ask -H \"Content-Type: application/json\" -d \"{\\\"game_slug\\\":\\\"mtg\\\",\\\"question\\\":\\\"How does priority work?\\\"}\""
