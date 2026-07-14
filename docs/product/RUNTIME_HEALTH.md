# RUNTIME_HEALTH.md

**Version:** 1.0.0  
**Endpoint:** `GET /runtime/runtime-health`

Publishes:

- aggregation / materialization latency
- scheduler stats
- cache hits/misses/ratio
- mart readiness
- runtime_health_score
- observability snapshot (`runtime.*`, `aggregation.*`, `scheduler.*`, `cache.*`, `health.*`)

Targets: dashboard <300ms · metric <100ms · materialize <5min · alert <1min · cache hit >95%.
