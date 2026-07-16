# PERFORMANCE_AUDIT.md

## Evidence sources

- Prior CI / docs Lighthouse artifacts for `/loja/busca`  
- Code structure: FacetedSearch `ssr: false`, heavy client stack  
- Global hydration watcher in MinimalProviders

## Findings

| ID | Metric / area | Finding |
|----|---------------|---------|
| PERF-01 | Lighthouse Perf cold | Unstable ~80 vs narrative claiming ~97 |
| PERF-02 | Main thread / INP risk | Heavy client facets + idle patterns incomplete |
| PERF-03 | Runtime | Global console hydration patch cost |

## Not fully measured this sprint

React Profiler traces, bundle analyzer report, CLS/INP field data, FPS/memory production — schedule instrumented pass in RC2 Gate after SEA/PERF fix candidates.

## Bottleneck hypothesis

1. Search page JS weight + client-only facets.  
2. Over-fetch / re-render on filter change.  
3. Optional: hydration mismatch noise.

## Gate proposal

- Cold Perf median ≥ budget (product: pick 90 or rewrite docs).  
- Fail CI if SEA-02 regression (analytics ≠ perf but ship together).
