import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Layout } from '../components/Layout'

const API = import.meta.env.VITE_CWM_API_BASE || 'http://127.0.0.1:8787'

type Health = {
  mode: string
  systemReady: { ok: boolean; reason?: string }
  window?: string
  today: { completed: number; failed: number; running: number; queued: number }
  openFailures: number
  workflows: Record<string, string>
  researchRuns?: Array<{ status: string; c: number }>
  scriptRuns?: Array<{ status: string; c: number }>
  productionRuns?: Array<{ status: string; c: number }>
  productionStages?: Array<{ stage: string; c: number }>
  publicationRuns?: Array<{ status: string; c: number }>
  winners?: Array<{ status: string; c: number }>
  strategyRecommendations?: { c: number }
  aiCostCents?: number
  observability?: {
    successRate: number
    failureRate: number
    averageDurationMs: number
    retryCount: number
    dlqCount: number
    aiCostCents: number
  }
}

type Execution = {
  execution_id: string
  workflow: string
  status: string
  reality: string
  duration_ms: number | null
  items_output: number
  error: string | null
  created_at: string
}

type Snapshot = {
  workspace: { id: string; name: string; approval_mode: string; daily_content_qty: number }
  contents: Array<{ id: string; title: string; status: string; performance_class: string | null; reality: string }>
  war: {
    day: number
    revenue_cents: number
    goal_revenue_cents: number
    posts: number
    views: number
    leads: number
    sales: number
  } | null
  runs: Execution[]
}

export function AutomationCenter() {
  const [health, setHealth] = useState<Health | null>(null)
  const [workspaceId, setWorkspaceId] = useState(localStorage.getItem('cwm_workspace') || '')
  const [snap, setSnap] = useState<Snapshot | null>(null)
  const [log, setLog] = useState('')
  const [busy, setBusy] = useState(false)
  const [researchRuns, setResearchRuns] = useState<Array<Record<string, unknown>>>([])
  const [scriptRuns, setScriptRuns] = useState<Array<Record<string, unknown>>>([])
  const [productionRuns, setProductionRuns] = useState<Array<Record<string, unknown>>>([])
  const [publicationRuns, setPublicationRuns] = useState<Array<Record<string, unknown>>>([])
  const [metricSnapshots, setMetricSnapshots] = useState<Array<Record<string, unknown>>>([])
  const [recommendations, setRecommendations] = useState<Array<Record<string, unknown>>>([])
  const [connections, setConnections] = useState<Record<string, unknown> | null>(null)
  const [preflight, setPreflight] = useState<Record<string, unknown> | null>(null)
  const [experiments, setExperiments] = useState<Array<Record<string, unknown>>>([])
  const [selectedProduction, setSelectedProduction] = useState<Record<string, unknown> | null>(null)
  const [windowFilter, setWindowFilter] = useState<'24h' | '7d' | '30d'>('24h')
  const [workflowFilter, setWorkflowFilter] = useState('')
  const [providerFilter, setProviderFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [stageFilter, setStageFilter] = useState('')

  async function refresh() {
    const params = new URLSearchParams({ window: windowFilter })
    if (workspaceId) params.set('workspaceId', workspaceId)
    if (workflowFilter) params.set('workflow', workflowFilter)
    if (providerFilter) params.set('provider', providerFilter)
    const h = await fetch(`${API}/api/automation/health?${params}`).then((r) => r.json())
    setHealth(h)
    if (workspaceId) {
      const s = await fetch(`${API}/api/workspaces/${workspaceId}`).then((r) => r.json())
      if (!s.error) setSnap(s)
      const rr = await fetch(`${API}/api/research/workspaces/${workspaceId}/runs`).then((r) => r.json())
      const sr = await fetch(`${API}/api/scripts/workspaces/${workspaceId}/runs`).then((r) => r.json())
      const pr = await fetch(`${API}/api/production/workspaces/${workspaceId}/runs`).then((r) => r.json())
      const pub = await fetch(`${API}/api/publishing/workspaces/${workspaceId}/runs`).then((r) => r.json())
      const snaps = await fetch(`${API}/api/analytics/workspaces/${workspaceId}/snapshots`).then((r) =>
        r.json(),
      )
      const recs = await fetch(`${API}/api/strategy/workspaces/${workspaceId}/recommendations`).then((r) =>
        r.json(),
      )
      setResearchRuns(rr.runs || [])
      setScriptRuns(sr.runs || [])
      let runs = (pr.runs || []) as Array<Record<string, unknown>>
      if (statusFilter) runs = runs.filter((r) => String(r.status) === statusFilter)
      if (stageFilter) runs = runs.filter((r) => String(r.current_stage || '') === stageFilter)
      setProductionRuns(runs)
      setPublicationRuns(pub.runs || [])
      setMetricSnapshots(snaps.snapshots || [])
      setRecommendations(recs.recommendations || [])
      const conn = await fetch(`${API}/api/publishing/connections?workspaceId=${workspaceId}`).then((r) =>
        r.json(),
      )
      setConnections(conn)
      const pf = await fetch(`${API}/api/validation/preflight?workspaceId=${workspaceId}`).then((r) =>
        r.json(),
      )
      setPreflight(pf)
      const ex = await fetch(`${API}/api/validation/experiments?workspaceId=${workspaceId}`).then((r) =>
        r.json(),
      )
      setExperiments(ex.experiments || [])
    }
  }

  useEffect(() => {
    void refresh()
    const t = setInterval(() => void refresh(), 5000)
    return () => clearInterval(t)
  }, [workspaceId, windowFilter, workflowFilter, providerFilter, statusFilter, stageFilter])

  async function createWorkspace(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      const res = await fetch(`${API}/api/workspaces`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'NEXUS War Machine', email: 'ops@nexus.local' }),
      })
      const data = await res.json()
      setWorkspaceId(data.workspaceId)
      localStorage.setItem('cwm_workspace', data.workspaceId)
      setLog(`Workspace criado: ${data.workspaceId}`)
      await refresh()
    } finally {
      setBusy(false)
    }
  }

  async function startWar() {
    if (!workspaceId) return
    setBusy(true)
    try {
      await fetch(`${API}/api/workspaces/${workspaceId}/war/start`, { method: 'POST' })
      setLog('30-Day War iniciado')
      await refresh()
    } finally {
      setBusy(false)
    }
  }

  async function trigger(workflow: string) {
    if (!workspaceId) return
    setBusy(true)
    try {
      const res = await fetch(`${API}/api/automation/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflow, workspaceId, payload: { source: 'automation-center' } }),
      })
      const data = await res.json()
      setLog(JSON.stringify(data, null, 2))
      await refresh()
    } finally {
      setBusy(false)
    }
  }

  const progress = snap?.war
    ? Math.min(100, Math.round((snap.war.revenue_cents / snap.war.goal_revenue_cents) * 100))
    : 0

  return (
    <Layout>
      <section className="shell page-block fade-up">
        <p className="brand-mark">
          NEXUS <span>IA</span>
        </p>
        <h1>Automation Center</h1>
        <p className="promise" style={{ maxWidth: '40rem' }}>
          Control Plane da Content War Machine. n8n orquestra; PostgreSQL/SQLite guarda o estado.
          Modo atual: <strong>{health?.mode ?? '…'}</strong>
          {health && !health.systemReady.ok ? ` — ${health.systemReady.reason}` : ''}
        </p>

        <div className="flow-strip" style={{ marginTop: '1.5rem' }}>
          <div>
            <strong>{health?.today.running ?? 0}</strong>
            <span>Running</span>
          </div>
          <div>
            <strong>{health?.today.completed ?? 0}</strong>
            <span>Completed today</span>
          </div>
          <div>
            <strong>{health?.today.failed ?? 0}</strong>
            <span>Failed today</span>
          </div>
          <div>
            <strong>{health?.today.queued ?? 0}</strong>
            <span>Queued</span>
          </div>
          <div>
            <strong>{health?.openFailures ?? 0}</strong>
            <span>Dead letters</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '2rem' }}>
          <button className="btn btn-signal" disabled={busy} onClick={createWorkspace}>
            Create Workspace
          </button>
          <button className="btn btn-ghost" disabled={busy || !workspaceId} onClick={startWar}>
            Start 30-Day War
          </button>
          <button
            className="btn btn-signal"
            disabled={busy || !workspaceId}
            onClick={() => trigger('content_daily_pipeline')}
          >
            Run Daily Engine
          </button>
          <button
            className="btn btn-ghost"
            disabled={busy || !workspaceId}
            onClick={() => trigger('research_engine')}
          >
            Run Research
          </button>
          <button
            className="btn btn-ghost"
            disabled={busy || !workspaceId}
            onClick={async () => {
              if (!workspaceId) return
              setBusy(true)
              try {
                const ws = await fetch(`${API}/api/workspaces/${workspaceId}`).then((r) => r.json())
                const idea = (ws.ideas || [])[0]
                if (!idea) {
                  setLog('Nenhuma idea — rode Research + Daily primeiro')
                  return
                }
                const res = await fetch(`${API}/api/scripts/generate`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    workspaceId,
                    contentIdeaId: idea.id,
                    platform: 'TIKTOK',
                    await: true,
                  }),
                })
                setLog(JSON.stringify(await res.json(), null, 2))
                await refresh()
              } finally {
                setBusy(false)
              }
            }}
          >
            Run Script Factory
          </button>
          <button
            className="btn btn-ghost"
            disabled={busy || !workspaceId}
            onClick={async () => {
              if (!workspaceId) return
              setBusy(true)
              try {
                const scripts = await fetch(`${API}/api/workspaces/${workspaceId}`).then((r) => r.json())
                const approved =
                  (scripts.scripts || []).find(
                    (s: { status: string; qa_status: string }) =>
                      s.status === 'approved' || (s.status === 'ready' && s.qa_status === 'passed'),
                  ) || (scripts.scripts || [])[0]
                if (!approved) {
                  setLog('Nenhum script — rode Script Factory primeiro')
                  return
                }
                const res = await fetch(`${API}/api/production/run`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    workspaceId,
                    scriptId: approved.id,
                    platform: approved.platform || 'YOUTUBE_SHORT',
                    allowUnapproved: true,
                    await: true,
                  }),
                })
                setLog(JSON.stringify(await res.json(), null, 2))
                await refresh()
              } finally {
                setBusy(false)
              }
            }}
          >
            Run Production
          </button>
          <button
            className="btn btn-ghost"
            disabled={busy || !workspaceId}
            onClick={async () => {
              if (!workspaceId) return
              setBusy(true)
              try {
                const ready = (snap?.contents || []).find((c) => c.status === 'qa' || c.status === 'published')
                const prod = productionRuns.find((r) => r.package_status === 'READY_FOR_PUBLISH')
                const contentId = ready?.id || (prod as { content_id?: string } | undefined)?.content_id
                if (!contentId) {
                  setLog('Nenhum content READY_FOR_PUBLISH — rode Production primeiro')
                  return
                }
                const res = await fetch(`${API}/api/publishing/run`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    workspaceId,
                    contentId,
                    platform: 'YOUTUBE_SHORT',
                    feedbackLoop: true,
                    scenario: 'WINNER',
                    await: true,
                  }),
                })
                setLog(JSON.stringify(await res.json(), null, 2))
                await refresh()
              } finally {
                setBusy(false)
              }
            }}
          >
            Run Publishing Loop
          </button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '1.25rem' }}>
          {(['24h', '7d', '30d'] as const).map((w) => (
            <button
              key={w}
              type="button"
              className={windowFilter === w ? 'btn btn-signal' : 'btn btn-ghost'}
              onClick={() => setWindowFilter(w)}
            >
              {w}
            </button>
          ))}
          <select
            value={workflowFilter}
            onChange={(e) => setWorkflowFilter(e.target.value)}
            style={{ padding: '0.6rem 0.8rem', border: '1px solid var(--line)', background: 'var(--white)' }}
          >
            <option value="">Todos workflows</option>
            {Object.keys(health?.workflows || {}).map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
          <input
            value={providerFilter}
            onChange={(e) => setProviderFilter(e.target.value)}
            placeholder="provider"
            style={{ padding: '0.6rem 0.8rem', border: '1px solid var(--line)', background: 'var(--white)' }}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '0.6rem 0.8rem', border: '1px solid var(--line)', background: 'var(--white)' }}
          >
            <option value="">Production status</option>
            {['QUEUED', 'COMPLETED', 'PARTIAL', 'FAILED', 'REQUIRES_REVIEW', 'CANCELLED'].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            style={{ padding: '0.6rem 0.8rem', border: '1px solid var(--line)', background: 'var(--white)' }}
          >
            <option value="">Production stage</option>
            {['PLANNING', 'VOICE', 'VISUALS', 'SUBTITLES', 'COMPOSING', 'THUMBNAIL', 'QA', 'STORAGE'].map(
              (s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ),
            )}
          </select>
        </div>

        <div className="flow-strip" style={{ marginTop: '1.25rem' }}>
          <div>
            <strong>{Math.round((health?.observability?.successRate ?? 0) * 100)}%</strong>
            <span>Success rate ({health?.window || windowFilter})</span>
          </div>
          <div>
            <strong>{Math.round((health?.observability?.failureRate ?? 0) * 100)}%</strong>
            <span>Failure rate</span>
          </div>
          <div>
            <strong>{health?.observability?.averageDurationMs ?? 0}ms</strong>
            <span>Avg duration</span>
          </div>
          <div>
            <strong>{health?.observability?.retryCount ?? 0}</strong>
            <span>Retries</span>
          </div>
          <div>
            <strong>{health?.observability?.dlqCount ?? health?.openFailures ?? 0}</strong>
            <span>DLQ</span>
          </div>
        </div>

        <div className="flow-strip" style={{ marginTop: '0.75rem' }}>
          <div>
            <strong>{health?.aiCostCents ?? 0}</strong>
            <span>AI cost (¢)</span>
          </div>
          <div>
            <strong>{researchRuns.length}</strong>
            <span>Research runs</span>
          </div>
          <div>
            <strong>{scriptRuns.length}</strong>
            <span>Script runs</span>
          </div>
          <div>
            <strong>{productionRuns.length}</strong>
            <span>Production runs</span>
          </div>
          <div>
            <strong>
              {productionRuns.filter((r) => r.status === 'COMPLETED').length}/
              {Math.max(productionRuns.length, 1)}
            </strong>
            <span>Production success</span>
          </div>
        </div>

        {workspaceId ? (
          <p className="fine" style={{ marginTop: '1rem' }}>
            Workspace: {workspaceId}
          </p>
        ) : null}

        {snap?.war ? (
          <div className="split-list" style={{ marginTop: '2.5rem' }}>
            <article>
              <h3>
                DAY {snap.war.day} / 30
              </h3>
              <p>
                Revenue R${(snap.war.revenue_cents / 100).toFixed(0)} / R$
                {(snap.war.goal_revenue_cents / 100).toFixed(0)} ({progress}%)
              </p>
            </article>
            <article>
              <h3>Posts / Views</h3>
              <p>
                {snap.war.posts} posts · {snap.war.views} views
              </p>
            </article>
            <article>
              <h3>Leads / Sales</h3>
              <p>
                {snap.war.leads} leads · {snap.war.sales} sales
              </p>
            </article>
          </div>
        ) : null}

        <h2 style={{ marginTop: '3rem', fontFamily: 'var(--font-display)', letterSpacing: '-0.04em' }}>
          Research Runs
        </h2>
        <div className="kit-grid">
          <pre>
            {researchRuns
              .slice(0, 10)
              .map(
                (r) =>
                  `${r.created_at} | ${r.status} | items=${r.items_found} topics=${r.topics_created} | ${r.provider || '-'}`,
              )
              .join('\n') || 'Nenhum research run.'}
          </pre>
        </div>

        <h2 style={{ marginTop: '2rem', fontFamily: 'var(--font-display)', letterSpacing: '-0.04em' }}>
          Script Runs
        </h2>
        <div className="kit-grid">
          <pre>
            {scriptRuns
              .slice(0, 10)
              .map(
                (r) =>
                  `${r.created_at} | ${r.status} | ${r.platform || '-'} | cost=${r.estimated_cost_cents}¢ | tokens=${Number(r.tokens_input || 0) + Number(r.tokens_output || 0)}`,
              )
              .join('\n') || 'Nenhum script run.'}
          </pre>
        </div>

        <h2 style={{ marginTop: '2rem', fontFamily: 'var(--font-display)', letterSpacing: '-0.04em' }}>
          Production
        </h2>
        <div className="flow-strip" style={{ marginTop: '0.75rem' }}>
          {(
            [
              ['QUEUED', 'Queued'],
              ['COMPLETED', 'Completed'],
              ['PARTIAL', 'Partial'],
              ['FAILED', 'Failed'],
            ] as const
          ).map(([status, label]) => (
            <div key={status}>
              <strong>{productionRuns.filter((r) => r.status === status).length}</strong>
              <span>{label}</span>
            </div>
          ))}
          <div>
            <strong>{health?.openFailures ?? 0}</strong>
            <span>DLQ</span>
          </div>
        </div>
        <div className="kit-grid" style={{ marginTop: '1rem' }}>
          <pre>
            {productionRuns
              .slice(0, 12)
              .map((r) => {
                const stages = [
                  'PLANNING',
                  'VOICE',
                  'VISUALS',
                  'SUBTITLES',
                  'COMPOSING',
                  'THUMBNAIL',
                  'QA',
                  'STORAGE',
                ]
                const result = (() => {
                  try {
                    return JSON.parse(String(r.result || '{}')) as {
                      stages?: Record<string, { ok?: boolean }>
                    }
                  } catch {
                    return {}
                  }
                })()
                const timeline = stages
                  .map((s) => {
                    if (result.stages?.[s]?.ok) return `✓ ${s}`
                    if (r.current_stage === s) return `→ ${s}`
                    return `○ ${s}`
                  })
                  .join(' · ')
                return `${r.created_at} | ${r.status} | stage=${r.current_stage || '-'} | pkg=${r.package_status} | score=${r.quality_score ?? '-'}\n  ${timeline}`
              })
              .join('\n\n') || 'Nenhum production run.'}
          </pre>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
            {productionRuns.slice(0, 5).map((r) => (
              <button
                key={String(r.id)}
                type="button"
                className="btn btn-ghost"
                onClick={async () => {
                  const detail = await fetch(`${API}/api/production/runs/${r.id}`).then((x) => x.json())
                  setSelectedProduction(detail)
                  setLog(JSON.stringify(detail, null, 2))
                }}
              >
                Detalhe {String(r.id).slice(0, 8)}
              </button>
            ))}
          </div>
          {selectedProduction ? (
            <pre style={{ marginTop: '0.75rem' }}>
              Assets: {Array.isArray(selectedProduction.assets) ? selectedProduction.assets.length : 0}
              {' · '}
              Package: {String((selectedProduction.package as { status?: string } | null)?.status || '-')}
              {' · '}
              Error: {String(selectedProduction.error || '-')}
            </pre>
          ) : null}
        </div>

        <h2 style={{ marginTop: '2rem', fontFamily: 'var(--font-display)', letterSpacing: '-0.04em' }}>
          Production Validation
        </h2>
        <p className="promise" style={{ maxWidth: '42rem', marginBottom: '0.75rem' }}>
          SAFE ≠ READY TO PUBLISH. Infraestrutura pronta é diferente de janela de publicação aberta.
          Evidência real ainda é pendente até o primeiro publish YouTube controlado.
        </p>
        <div className="flow-strip">
          <div>
            <strong>{String(preflight?.overall || '…')}</strong>
            <span>Preflight</span>
          </div>
          <div>
            <strong>{preflight?.safe ? 'SAFE' : 'WINDOW?'}</strong>
            <span>Safety posture</span>
          </div>
          <div>
            <strong>{preflight?.readyToPublish ? 'YES' : 'NO'}</strong>
            <span>Ready to publish</span>
          </div>
          <div>
            <strong>{experiments[0] ? String(experiments[0].experiment_status) : '—'}</strong>
            <span>Current experiment</span>
          </div>
        </div>
        <div className="kit-grid">
          <pre>
            {(((preflight?.checks as Array<Record<string, unknown>>) || [])
              .map((c) => `[${c.status}] ${c.label}${c.detail ? ` — ${c.detail}` : ''}`)
              .join('\n') || 'Carregue um workspace para ver Production Readiness.')}
          </pre>
          <pre>
            {experiments
              .slice(0, 5)
              .map(
                (e) =>
                  `${e.experiment_status} | ${e.platform} | origin=${e.data_origin} | content=${String(e.content_id || '-').slice(0, 8)} | ext=${e.external_id || '-'}`,
              )
              .join('\n') || 'Nenhum experimento 5.1. Ver docs/PRODUCTION_RUNBOOK.md'}
          </pre>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
          <button
            type="button"
            className="btn btn-ghost"
            disabled={!workspaceId || busy}
            onClick={async () => {
              if (!workspaceId) return
              setBusy(true)
              try {
                const res = await fetch(`${API}/api/validation/safety/restore-defaults`, {
                  method: 'POST',
                }).then((r) => r.json())
                setLog(JSON.stringify(res, null, 2))
                await refresh()
              } finally {
                setBusy(false)
              }
            }}
          >
            Restaurar safety defaults
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            disabled={!workspaceId || busy}
            onClick={async () => {
              if (!workspaceId) return
              setBusy(true)
              try {
                const res = await fetch(`${API}/api/validation/preflight?workspaceId=${workspaceId}`).then(
                  (r) => r.json(),
                )
                setPreflight(res)
                setLog(JSON.stringify(res, null, 2))
              } finally {
                setBusy(false)
              }
            }}
          >
            Rodar preflight
          </button>
        </div>

        <h2 style={{ marginTop: '2rem', fontFamily: 'var(--font-display)', letterSpacing: '-0.04em' }}>
          Connections
        </h2>
        <div className="kit-grid">
          <pre>
            {((connections?.connections as Array<Record<string, unknown>>) || [])
              .map(
                (c) =>
                  `${c.platform}: ${c.status || c.publisher} ${c.lastVerifiedAt ? `· verified ${c.lastVerifiedAt}` : ''}`,
              )
              .join('\n') || 'Carregue um workspace para ver conexões.'}
          </pre>
        </div>

        <h2 style={{ marginTop: '2rem', fontFamily: 'var(--font-display)', letterSpacing: '-0.04em' }}>
          Publishing Safety
        </h2>
        <div className="flow-strip">
          <div>
            <strong>{String((connections?.safety as { publishingEnabled?: boolean })?.publishingEnabled ?? false)}</strong>
            <span>Publishing Enabled</span>
          </div>
          <div>
            <strong>{String((connections?.safety as { dryRun?: boolean })?.dryRun ?? true)}</strong>
            <span>Dry Run</span>
          </div>
          <div>
            <strong>
              {String((connections?.safety as { globalPublishingKillSwitch?: boolean })?.globalPublishingKillSwitch ?? true)}
            </strong>
            <span>Kill Switch</span>
          </div>
          <div>
            <strong>
              {(connections?.safety as { maxPublicationsPerDay?: number })?.maxPublicationsPerDay ?? 1}
            </strong>
            <span>Daily Limit</span>
          </div>
        </div>

        <h2 style={{ marginTop: '2rem', fontFamily: 'var(--font-display)', letterSpacing: '-0.04em' }}>
          Publishing
        </h2>
        <div className="flow-strip">
          {(['QUEUED', 'SCHEDULED', 'PUBLISHED', 'FAILED'] as const).map((status) => (
            <div key={status}>
              <strong>{publicationRuns.filter((r) => r.status === status).length}</strong>
              <span>{status}</span>
            </div>
          ))}
        </div>
        <div className="kit-grid">
          <pre>
            {publicationRuns
              .slice(0, 10)
              .map(
                (r) =>
                  `${r.created_at} | ${r.status} | ${r.platform} | ext=${r.external_id || '-'} | ${r.reality}`,
              )
              .join('\n') || 'Nenhuma publication.'}
          </pre>
        </div>

        <h2 style={{ marginTop: '2rem', fontFamily: 'var(--font-display)', letterSpacing: '-0.04em' }}>
          Analytics
        </h2>
        <div className="flow-strip">
          <div>
            <strong>{metricSnapshots.reduce((a, s) => a + Number(s.views || 0), 0)}</strong>
            <span>Views</span>
          </div>
          <div>
            <strong>
              {metricSnapshots.length
                ? (
                    metricSnapshots.reduce((a, s) => a + Number(s.completion_rate || 0), 0) /
                    metricSnapshots.length
                  ).toFixed(2)
                : 0}
            </strong>
            <span>Avg completion</span>
          </div>
          <div>
            <strong>{metricSnapshots.reduce((a, s) => a + Number(s.clicks || 0), 0)}</strong>
            <span>Clicks</span>
          </div>
          <div>
            <strong>{metricSnapshots.reduce((a, s) => a + Number(s.conversions || 0), 0)}</strong>
            <span>Conversions</span>
          </div>
        </div>

        <h2 style={{ marginTop: '2rem', fontFamily: 'var(--font-display)', letterSpacing: '-0.04em' }}>
          Winners
        </h2>
        <div className="flow-strip">
          {(health?.winners || []).map((w) => (
            <div key={w.status}>
              <strong>{w.c}</strong>
              <span>{w.status}</span>
            </div>
          ))}
          <div>
            <strong>
              {(snap?.contents || []).filter((c) => c.performance_class === 'WINNER').length}
            </strong>
            <span>Top performers</span>
          </div>
        </div>

        <h2 style={{ marginTop: '2rem', fontFamily: 'var(--font-display)', letterSpacing: '-0.04em' }}>
          Strategy
        </h2>
        <div className="kit-grid">
          <pre>
            {recommendations
              .slice(0, 12)
              .map(
                (r) =>
                  `${r.created_at} | ${r.kind || '-'} | ${r.status} | conf=${Number(r.confidence || 0).toFixed(2)} | evidence=${r.evidence_count}`,
              )
              .join('\n') || 'Nenhuma recommendation.'}
          </pre>
        </div>

        <h2 style={{ marginTop: '3rem', fontFamily: 'var(--font-display)', letterSpacing: '-0.04em' }}>
          Executions
        </h2>
        <div className="kit-grid">
          <pre>
            {(snap?.runs ?? [])
              .slice(0, 12)
              .map(
                (r) =>
                  `${r.created_at} | ${r.workflow} | ${r.status} | ${r.reality} | out=${r.items_output} | ${r.duration_ms ?? '-'}ms${r.error ? ` | ERR ${r.error}` : ''}`,
              )
              .join('\n') || 'Nenhuma execução ainda.'}
          </pre>
        </div>

        <h2 style={{ marginTop: '2rem', fontFamily: 'var(--font-display)', letterSpacing: '-0.04em' }}>
          Contents
        </h2>
        <div className="kit-grid">
          <pre>
            {(snap?.contents ?? [])
              .slice(0, 20)
              .map(
                (c) =>
                  `${c.status.padEnd(16)} ${c.reality.padEnd(6)} ${(c.performance_class || '-').padEnd(10)} ${c.title}`,
              )
              .join('\n') || 'Sem conteúdos.'}
          </pre>
        </div>

        {log ? (
          <>
            <h2 style={{ marginTop: '2rem', fontFamily: 'var(--font-display)' }}>Last response</h2>
            <pre>{log}</pre>
          </>
        ) : null}
      </section>
    </Layout>
  )
}
