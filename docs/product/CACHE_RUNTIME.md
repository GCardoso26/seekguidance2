# CACHE_RUNTIME.md

**Version:** 1.0.0  
**Module:** `analytics_runtime.cache`

- TTL default 30s (dashboard keys)
- Auto-invalidate on materialize (`mart:`, `dash:`)
- Target hit ratio **>95%** after warmup
- Target dashboard p95 **<300ms** (in-process mart reads)
