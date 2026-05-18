@echo off
cd /d %~dp0
docker compose -f docker-compose.production.yml build
docker compose -f docker-compose.production.yml up -d
call healthcheck.bat
