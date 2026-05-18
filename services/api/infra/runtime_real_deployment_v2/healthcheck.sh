#!/usr/bin/env sh
curl -sf http://127.0.0.1:8000/health && curl -sf http://127.0.0.1:8000/runtime/health && echo OK
