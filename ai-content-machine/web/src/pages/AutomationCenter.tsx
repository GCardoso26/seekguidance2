import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Layout } from '../components/Layout'

const API = import.meta.env.VITE_CWM_API_BASE || 'http://127.0.0.1:8787'

type Health = {
  mode: string
  systemReady: { ok: boolean; reason?: string }
  today: { completed: number; failed: number; running: number; queued: number }
  openFailures: number
  workflows: Record<string, string>
  researchRuns?: Array<{ status: string; c: number }>
  scriptRuns?: Array<{ status: string; c: number }>
  aiCostCents?: number
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

  async function refresh() {
    const healthUrl = workspaceId
      ? `${API}/api/automation/health?workspaceId=${workspaceId}`
      : `${API}/api/automation/health`
    const h = await fetch(healthUrl).then((r) => r.json())
    setHealth(h)
    if (workspaceId) {
      const s = await fetch(`${API}/api/workspaces/${workspaceId}`).then((r) => r.json())
      if (!s.error) setSnap(s)
      const rr = await fetch(`${API}/api/research/workspaces/${workspaceId}/runs`).then((r) => r.json())
      const sr = await fetch(`${API}/api/scripts/workspaces/${workspaceId}/runs`).then((r) => r.json())
      setResearchRuns(rr.runs || [])
      setScriptRuns(sr.runs || [])
    }
  }

  useEffect(() => {
    void refresh()
    const t = setInterval(() => void refresh(), 5000)
    return () => clearInterval(t)
  }, [workspaceId])

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
        </div>

        <div className="flow-strip" style={{ marginTop: '1.25rem' }}>
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
            <strong>{health?.openFailures ?? 0}</strong>
            <span>DLQ</span>
          </div>
          <div>
            <strong>
              {scriptRuns.filter((r) => r.status === 'COMPLETED').length}/
              {Math.max(scriptRuns.length, 1)}
            </strong>
            <span>Script success</span>
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
