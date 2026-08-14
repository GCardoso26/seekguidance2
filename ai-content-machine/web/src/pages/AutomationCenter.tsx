import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Layout } from '../components/Layout'

const API = import.meta.env.VITE_CWM_API_BASE || 'http://127.0.0.1:8787'

function isWorkspaceId(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function visualProviderOfRun(r: Record<string, unknown>): string {
  let result: Record<string, unknown> = {}
  const raw = r.result
  if (typeof raw === 'string') {
    try {
      result = JSON.parse(raw) as Record<string, unknown>
    } catch {
      result = {}
    }
  } else if (raw && typeof raw === 'object') {
    result = raw as Record<string, unknown>
  }
  const fm = result.factoryMetrics as { visualProvider?: string } | undefined
  const stages = result.stages as Record<string, { provider?: string }> | undefined
  return String(fm?.visualProvider || stages?.VISUALS?.provider || '')
}

/** Pre-gate mock runs can still say READY_FOR_PUBLISH — never pick those for YouTube. */
function isVisuallyPublishableRun(r: Record<string, unknown>): boolean {
  const pkg = String(r.package_status || '')
  if (pkg !== 'READY_FOR_PUBLISH' && pkg !== 'PUBLISHED') return false
  const provider = visualProviderOfRun(r)
  if (provider === 'mock_visual') return false
  return provider === 'comfyui' || provider === 'asset_library'
}

function findPublishableRun(
  runs: Array<Record<string, unknown>> | undefined,
): Record<string, unknown> | undefined {
  return (runs || []).find(isVisuallyPublishableRun)
}

function readStoredWorkspaceId(): string {
  const v = localStorage.getItem('cwm_workspace') || ''
  if (isWorkspaceId(v)) return v
  if (v) localStorage.removeItem('cwm_workspace')
  return ''
}

async function fetchJson(url: string, init?: RequestInit): Promise<unknown> {
  const res = await fetch(url, init)
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`HTTP ${res.status} ${url}${text ? ` — ${text.slice(0, 180)}` : ''}`)
  }
  return res.json()
}

type ApiResult = { ok: boolean; status: number; data: Record<string, unknown> }

async function postJson(url: string, body?: unknown): Promise<ApiResult> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>
  return { ok: res.ok, status: res.status, data }
}

/**
 * The API answers operator mistakes with {error, hint, nextAction} and skipped work
 * with {skipped, reason, hint}. Surface both as the headline instead of leaving the
 * operator to read raw JSON.
 */
function describeApiResult(result: ApiResult): string {
  const { ok, status, data } = result
  const json = JSON.stringify(data, null, 2)
  const hint = typeof data.hint === 'string' ? data.hint : ''

  if (!ok) {
    const code =
      typeof data.error === 'string'
        ? data.error
        : typeof data.message === 'string'
          ? data.message
          : `HTTP ${status}`
    return `❌ ${code}${hint ? `\n\n➡ ${hint}` : ''}\n\n${json}`
  }
  if (data.skipped === true) {
    return `⚠️ ${String(data.reason || 'skipped')}${hint ? `\n\n➡ ${hint}` : ''}\n\n${json}`
  }
  return json
}

/** `await:true` endpoints wrap the real outcome in `result`. */
function innerResult(data: Record<string, unknown>): Record<string, unknown> {
  const inner = data.result
  return inner && typeof inner === 'object' ? (inner as Record<string, unknown>) : data
}

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

type Idea = {
  id: string
  title: string
  status: string
  opportunity_score?: number
}

type ScriptRow = {
  id: string
  idea_id: string
  status: string
  qa_status: string
  platform: string | null
  hook?: string
  quality_score?: number | null
  created_at: string
}

type Snapshot = {
  workspace: { id: string; name: string; approval_mode: string; daily_content_qty: number }
  contents: Array<{ id: string; title: string; status: string; performance_class: string | null; reality: string }>
  ideas: Idea[]
  scripts: ScriptRow[]
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

type FactoryStatus = {
  script: { ollama: string; api: string; mock: string; status: string }
  voice: { resolver: string; kokoro: string; real: string; mock: string; status: string }
  visual: { resolver: string; comfy: string; mock: string; status: string; stock: string; videoGeneration: string; comfyProbe?: { status: string; latencyMs: number; detail?: string } }
  composition: { ffmpeg_kenburns: string }
  thumbnail: { mock: string }
  storage: { local: string; s3: string }
  ffmpeg: string
  source: 'endpoint' | 'derived'
}

function isApprovedScript(s: Pick<ScriptRow, 'status' | 'qa_status'>): boolean {
  return s.status === 'approved' || (s.status === 'ready' && s.qa_status === 'passed')
}

export function AutomationCenter() {
  const [health, setHealth] = useState<Health | null>(null)
  const [workspaceId, setWorkspaceId] = useState(readStoredWorkspaceId)
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
  const [workspaceList, setWorkspaceList] = useState<Array<{ id: string; name: string }>>([])
  const [selectedProduction, setSelectedProduction] = useState<Record<string, unknown> | null>(null)
  const [publishContentId, setPublishContentId] = useState('')
  const [windowFilter, setWindowFilter] = useState<'24h' | '7d' | '30d'>('24h')
  const [workflowFilter, setWorkflowFilter] = useState('')
  const [providerFilter, setProviderFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [stageFilter, setStageFilter] = useState('')
  const [apiOnline, setApiOnline] = useState<boolean | null>(null)
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [ideasSource, setIdeasSource] = useState<'endpoint' | 'snapshot'>('snapshot')
  const [selectedIdeaId, setSelectedIdeaId] = useState('')
  const [scripts, setScripts] = useState<ScriptRow[]>([])
  const [selectedScriptId, setSelectedScriptId] = useState('')
  const [regenerateScript, setRegenerateScript] = useState(false)
  const [regenerateProduction, setRegenerateProduction] = useState(false)
  const [workspaceError, setWorkspaceError] = useState('')
  const [factoryStatus, setFactoryStatus] = useState<FactoryStatus | null>(null)
  const [dryRunOkForContentId, setDryRunOkForContentId] = useState<string | null>(null)

  async function refresh() {
    const params = new URLSearchParams({ window: windowFilter })
    if (isWorkspaceId(workspaceId)) params.set('workspaceId', workspaceId)
    if (workflowFilter) params.set('workflow', workflowFilter)
    if (providerFilter) params.set('provider', providerFilter)

    // Health decides online/offline. Everything else is workspace-scoped and must not
    // be able to claim the API is down (an unknown workspaceId 404s, and this loop
    // re-runs every 5s — it used to overwrite the log with a bogus offline banner).
    try {
      const h = (await fetchJson(`${API}/api/automation/health?${params}`)) as Health
      setHealth(h)
      setApiOnline(true)
      setWorkspaceError('')
    } catch (err) {
      setApiOnline(false)
      const msg = err instanceof Error ? err.message : String(err)
      setLog(
        `API offline ou inacessível (${API}).\n${msg}\n\nNa VM: sudo docker compose ps && curl -s http://127.0.0.1:8787/health`,
      )
      return
    }

    try {
      const listed = (await fetchJson(`${API}/api/workspaces`)) as {
        workspaces?: Array<{ id: string; name: string }>
      }
      setWorkspaceList(listed.workspaces || [])
      if (isWorkspaceId(workspaceId)) {
        const s = (await fetchJson(`${API}/api/workspaces/${workspaceId}`)) as Snapshot & {
          error?: string
        }
        if (!s.error) setSnap(s)
        const rr = (await fetchJson(`${API}/api/research/workspaces/${workspaceId}/runs`)) as {
          runs?: Array<Record<string, unknown>>
        }
        const sr = (await fetchJson(`${API}/api/scripts/workspaces/${workspaceId}/runs`)) as {
          runs?: Array<Record<string, unknown>>
        }
        const pr = (await fetchJson(`${API}/api/production/workspaces/${workspaceId}/runs`)) as {
          runs?: Array<Record<string, unknown>>
        }
        const pub = (await fetchJson(`${API}/api/publishing/workspaces/${workspaceId}/runs`)) as {
          runs?: Array<Record<string, unknown>>
        }
        const snaps = (await fetchJson(
          `${API}/api/analytics/workspaces/${workspaceId}/snapshots`,
        )) as { snapshots?: Array<Record<string, unknown>> }
        const recs = (await fetchJson(
          `${API}/api/strategy/workspaces/${workspaceId}/recommendations`,
        )) as { recommendations?: Array<Record<string, unknown>> }
        setResearchRuns(rr.runs || [])
        setScriptRuns(sr.runs || [])
        let runs = (pr.runs || []) as Array<Record<string, unknown>>
        if (statusFilter) runs = runs.filter((r) => String(r.status) === statusFilter)
        if (stageFilter) runs = runs.filter((r) => String(r.current_stage || '') === stageFilter)
        setProductionRuns(runs)
        setPublicationRuns(pub.runs || [])
        setMetricSnapshots(snaps.snapshots || [])
        setRecommendations(recs.recommendations || [])
        setScripts((s.scripts as ScriptRow[]) || [])
        const conn = (await fetchJson(
          `${API}/api/publishing/connections?workspaceId=${workspaceId}`,
        )) as Record<string, unknown>
        setConnections(conn)
        const preflightParams = new URLSearchParams({ workspaceId })
        if (isWorkspaceId(publishContentId)) preflightParams.set('contentId', publishContentId)
        const pf = (await fetchJson(
          `${API}/api/validation/preflight?${preflightParams}`,
        )) as Record<string, unknown>
        setPreflight(pf)
        const ex = (await fetchJson(
          `${API}/api/validation/experiments?workspaceId=${workspaceId}`,
        )) as { experiments?: Array<Record<string, unknown>> }
        setExperiments(ex.experiments || [])

        // Ideas: prefer a dedicated endpoint if the sibling API agent has shipped one;
        // gracefully fall back to the workspace snapshot (already includes content_ideas).
        try {
          const ideasRes = (await fetchJson(
            `${API}/api/ideas/workspaces/${workspaceId}`,
          )) as { ideas?: Idea[] }
          setIdeas(ideasRes.ideas || (s.ideas as Idea[]) || [])
          setIdeasSource('endpoint')
        } catch {
          setIdeas((s.ideas as Idea[]) || [])
          setIdeasSource('snapshot')
        }

        // Factory status: GET /api/factory/status (script=Ollama/mock, voice=Kokoro/real/mock,
        // visual=Library resolver, composition=ffmpeg_kenburns). Falls back to a live production
        // run's `.providers` field if the endpoint is momentarily unavailable.
        try {
          const fstatus = (await fetchJson(`${API}/api/factory/status`)) as Omit<FactoryStatus, 'source'>
          setFactoryStatus({ ...fstatus, source: 'endpoint' })
        } catch {
          const latestProductionId = (runs[0] as { id?: string } | undefined)?.id
          if (latestProductionId) {
            try {
              const detail = (await fetchJson(
                `${API}/api/production/runs/${latestProductionId}`,
              )) as { providers?: Omit<FactoryStatus, 'source' | 'script'> }
              if (detail.providers) {
                setFactoryStatus({
                  script: { ollama: 'UNKNOWN', api: 'UNKNOWN', mock: 'UNKNOWN', status: 'UNKNOWN' },
                  voice: detail.providers.voice,
                  visual: detail.providers.visual,
                  composition: detail.providers.composition,
                  thumbnail: detail.providers.thumbnail,
                  storage: detail.providers.storage,
                  ffmpeg: detail.providers.ffmpeg,
                  source: 'derived',
                })
              } else {
                setFactoryStatus(null)
              }
            } catch {
              setFactoryStatus(null)
            }
          } else {
            setFactoryStatus(null)
          }
        }
      }
      setWorkspaceError('')
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setWorkspaceError(
        `API online, mas falhou ao carregar dados desta workspace: ${msg}. ` +
          'Confira se o Workspace ID existe (dropdown "Existentes") ou crie um novo.',
      )
    }
  }

  useEffect(() => {
    void refresh()
    const t = setInterval(() => void refresh(), 5000)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId, windowFilter, workflowFilter, providerFilter, statusFilter, stageFilter, publishContentId])

  useEffect(() => {
    if (!selectedIdeaId && ideas.length) setSelectedIdeaId(ideas[0].id)
  }, [ideas, selectedIdeaId])

  useEffect(() => {
    if (!selectedScriptId && scripts.length) {
      const approved = scripts.find((s) => isApprovedScript(s))
      setSelectedScriptId(approved?.id || scripts[0].id)
    }
  }, [scripts, selectedScriptId])

  async function createWorkspace(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      const res = await fetch(`${API}/api/workspaces`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'NEXUS War Machine',
          email: `ops+${Date.now()}@nexus.local`,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setLog(JSON.stringify(data, null, 2))
        return
      }
      if (!isWorkspaceId(String(data.workspaceId || ''))) {
        setLog(JSON.stringify(data, null, 2))
        return
      }
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

  async function createQuickIdea() {
    if (!workspaceId) return
    setBusy(true)
    try {
      const res = await postJson(`${API}/api/ideas`, {
        workspaceId,
        title: `Ideia rápida ${new Date().toLocaleTimeString('pt-BR')}`,
      })
      setLog(describeApiResult(res))
      const id = res.data.id
      if (res.ok && typeof id === 'string') setSelectedIdeaId(id)
      await refresh()
    } catch (err) {
      setLog(`Falha ao criar idea rápida: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setBusy(false)
    }
  }

  async function runScriptFactory() {
    if (!workspaceId) return
    const ideaId = selectedIdeaId || ideas[0]?.id
    if (!ideaId) {
      setLog('Nenhuma idea disponível — rode Run Research + Run Daily Engine (MOCK) ou "Nova idea rápida".')
      return
    }
    setBusy(true)
    try {
      const res = await postJson(`${API}/api/scripts/generate`, {
        workspaceId,
        contentIdeaId: ideaId,
        platform: 'YOUTUBE_SHORT',
        regenerate: regenerateScript,
        await: true,
      })
      setLog(describeApiResult(res))
      // Select whatever script this call produced — or, on an idempotent skip, the one
      // that already existed. Leaving the previous selection in place would make the
      // next Approve/Production click act on the wrong script.
      const inner = innerResult(res.data)
      const scriptId = inner.scriptId
      if (res.ok && typeof scriptId === 'string') setSelectedScriptId(scriptId)
      await refresh()
    } catch (err) {
      setLog(`Falha ao gerar script: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setBusy(false)
    }
  }

  async function approveScript() {
    if (!workspaceId || !selectedScriptId) return
    setBusy(true)
    try {
      const res = await postJson(`${API}/api/scripts/${selectedScriptId}/approve`, { workspaceId })
      setLog(describeApiResult(res))
      await refresh()
    } catch (err) {
      setLog(`Falha ao aprovar script: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setBusy(false)
    }
  }

  async function runProduction() {
    if (!workspaceId) return
    setBusy(true)
    try {
      const fresh = (await fetch(`${API}/api/workspaces/${workspaceId}`).then((r) => r.json())) as {
        scripts?: ScriptRow[]
      }
      const scripts = fresh.scripts || []
      const eligible = scripts.filter((s) => isApprovedScript(s))

      // Never quietly produce a different script than the one on screen.
      if (selectedScriptId) {
        const picked = scripts.find((s) => s.id === selectedScriptId)
        if (picked && !isApprovedScript(picked)) {
          setLog(
            `❌ O script selecionado está status=${picked.status}/qa_status=${picked.qa_status}.\n\n` +
              '➡ Clique "Approve Script" para liberá-lo. Production não troca de script silenciosamente ' +
              'nem aceita draft.',
          )
          return
        }
      }

      const chosen =
        (selectedScriptId && eligible.find((s) => s.id === selectedScriptId)) || eligible[0]
      if (!chosen) {
        setLog(
          'Nenhum script approved OU (ready + qa_status=passed) encontrado — sem fallback para draft.\n' +
            'Rode Script Factory (e Approve Script, se necessário) primeiro.',
        )
        return
      }

      const res = await postJson(`${API}/api/production/run`, {
        workspaceId,
        scriptId: chosen.id,
        platform: 'YOUTUBE_SHORT',
        regenerate: regenerateProduction,
        await: true,
      })
      const inner = innerResult(res.data)
      let logText = describeApiResult({ ...res, data: inner })
      if (inner.skipped === true && inner.reason === 'idempotent_skip') {
        logText +=
          '\n\nMarque "Regenerate" (checkbox ao lado do botão) e clique Run Production novamente ' +
          'para forçar um novo run.'
      }
      setLog(logText)
      await refresh()
    } catch (err) {
      setLog(`Falha ao rodar production: ${err instanceof Error ? err.message : String(err)}`)
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
        <p className="fine" style={{ marginTop: '0.5rem' }}>
          API: <code>{API}</code>
          {' · '}
          {apiOnline === null ? 'checando…' : apiOnline ? 'online' : 'offline (ERR_CONNECTION_REFUSED?)'}
        </p>
        {apiOnline === false ? (
          <pre style={{ marginTop: '0.75rem', maxWidth: '42rem' }}>
            {`A UI (:8080) não alcança a API (:8787).
Na VM:
  sudo docker compose ps
  sudo docker compose logs --tail=50 api
  curl -s http://127.0.0.1:8787/health
  sudo docker compose up -d api
Firewall/OCI Security List: porta 8787 liberada.`}
          </pre>
        ) : null}
        {apiOnline && workspaceError ? (
          <pre style={{ marginTop: '0.75rem', maxWidth: '42rem' }}>{workspaceError}</pre>
        ) : null}

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

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.75rem',
            marginTop: '1.5rem',
            alignItems: 'center',
          }}
        >
          <label className="fine" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            Workspace ID
            <input
              value={workspaceId}
              onChange={(e) => {
                const v = e.target.value.trim()
                setWorkspaceId(v)
                if (isWorkspaceId(v)) localStorage.setItem('cwm_workspace', v)
                else localStorage.removeItem('cwm_workspace')
              }}
              placeholder="cole o UUID do workspace"
              style={{ minWidth: '22rem', padding: '0.55rem 0.75rem' }}
            />
          </label>
          {workspaceList.length ? (
            <label className="fine" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              Existentes
              <select
                value={workspaceId}
                onChange={(e) => {
                  const v = e.target.value
                  setWorkspaceId(v)
                  if (isWorkspaceId(v)) localStorage.setItem('cwm_workspace', v)
                  else localStorage.removeItem('cwm_workspace')
                }}
                style={{ minWidth: '16rem', padding: '0.55rem 0.75rem' }}
              >
                <option value="">— selecionar —</option>
                {workspaceList.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.id.slice(0, 8)}…)
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <button
            type="button"
            className="btn btn-ghost"
            style={{ alignSelf: 'flex-end' }}
            onClick={() => void refresh()}
          >
            Aplicar
          </button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '2rem', alignItems: 'center' }}>
          <button className="btn btn-signal" disabled={busy} onClick={createWorkspace}>
            Create Workspace
          </button>
          <button className="btn btn-ghost" disabled={busy || !workspaceId} onClick={startWar}>
            Start 30-Day War
          </button>
          <button
            className="btn btn-ghost"
            disabled={busy || !workspaceId}
            onClick={() => trigger('content_daily_pipeline')}
            title="MOCK: gera research/ideas/scripts sintéticos para popular o workspace. Não é a fábrica real (Ollama/Kokoro/ffmpeg)."
          >
            Run Daily Engine (MOCK)
          </button>
          <button
            className="btn btn-ghost"
            disabled={busy || !workspaceId}
            onClick={() => trigger('research_engine')}
          >
            Run Research
          </button>
        </div>
        <p className="fine" style={{ maxWidth: '42rem', marginTop: '0.35rem' }}>
          "Run Daily Engine" é <strong>MOCK-only</strong> — útil para popular o workspace rapidamente com dados
          sintéticos, não passa por Ollama/Kokoro/ffmpeg.           O caminho real da fábrica de YouTube Shorts é:
          Idea → Script Factory (Ollama) → Approve → Production (Kokoro + Library + ComfyUI + ffmpeg_kenburns) → Publish gate.
          Sem ComfyUI READY, o MP4 nasce com Mock e **não** fica READY_FOR_PUBLISH.
        </p>

        <h3 style={{ marginTop: '1.5rem', fontFamily: 'var(--font-display)', letterSpacing: '-0.03em' }}>
          Fábrica real — YouTube Shorts
        </h3>
        <div className="flow-strip" style={{ marginTop: '0.5rem' }}>
          <div>
            <strong>{factoryStatus?.script.ollama || '—'}</strong>
            <span>Ollama (script)</span>
          </div>
          <div>
            <strong>{factoryStatus?.voice.kokoro || '—'}</strong>
            <span>Kokoro (voice)</span>
          </div>
          <div>
            <strong>{factoryStatus?.visual.comfy || '—'}</strong>
            <span>ComfyUI (MISS)</span>
          </div>
          <div>
            <strong>{factoryStatus?.visual.status || '—'}</strong>
            <span>Visuals (Library/fallback)</span>
          </div>
          <div>
            <strong>{factoryStatus?.composition.ffmpeg_kenburns || factoryStatus?.ffmpeg || '—'}</strong>
            <span>ffmpeg_kenburns</span>
          </div>
        </div>
        {factoryStatus?.visual.comfy && factoryStatus.visual.comfy !== 'READY' ? (
          <p className="fine" style={{ color: 'var(--signal, #b45309)', maxWidth: '46rem', marginTop: '0.35rem' }}>
            ComfyUI {factoryStatus.visual.comfy}
            {factoryStatus.visual.comfyProbe?.detail ? ` — ${factoryStatus.visual.comfyProbe.detail}` : ''}.
            Cenas novas caem em <code>mock_visual</code> → pacote <strong>READY_FOR_REVIEW</strong>, não publicável no YouTube.
            Ver <code>docs/COMFYUI_A1_VS_PC.md</code> (A1 CPU vs ponte GPU no PC).
          </p>
        ) : null}
        <p className="fine" style={{ marginTop: '0.25rem' }}>
          {factoryStatus
            ? factoryStatus.source === 'endpoint'
              ? 'Fonte: GET /api/factory/status'
              : 'Fonte: derivado (GET /api/factory/status indisponível) — abra "Detalhe" de uma Production run para status ao vivo.'
            : 'Sem dados de status ainda — rode Script Factory / Production ou aguarde GET /api/factory/status.'}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.75rem', alignItems: 'flex-end' }}>
          <label className="fine" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', minWidth: '20rem' }}>
            Idea ({ideasSource === 'endpoint' ? 'API /api/ideas' : 'workspace snapshot'})
            <select
              value={selectedIdeaId}
              onChange={(e) => setSelectedIdeaId(e.target.value)}
              style={{ padding: '0.55rem 0.75rem' }}
            >
              <option value="">— selecionar idea —</option>
              {ideas.map((i) => (
                <option key={i.id} value={i.id}>
                  [{i.status}] {i.title}
                </option>
              ))}
            </select>
          </label>
          <button className="btn btn-ghost" disabled={busy || !workspaceId} onClick={createQuickIdea}>
            Nova idea rápida
          </button>
          <label className="fine" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <input
              type="checkbox"
              checked={regenerateScript}
              onChange={(e) => setRegenerateScript(e.target.checked)}
            />
            Regenerar script (evita idempotent_skip)
          </label>
          <button
            className="btn btn-signal"
            disabled={busy || !workspaceId || !selectedIdeaId}
            onClick={runScriptFactory}
            title="Platform fixo em YOUTUBE_SHORT (não TIKTOK)"
          >
            Run Script Factory (YOUTUBE_SHORT)
          </button>
        </div>
        <p className="fine" style={{ maxWidth: '46rem', marginTop: '0.35rem' }}>
          Uma idea gera um script por platform. Rodar de novo na mesma idea devolve{' '}
          <code>idempotent_skip</code> apontando o script existente — marque "Regenerar script" para
          forçar um novo.
        </p>
        {!ideas.length ? (
          <p className="fine" style={{ maxWidth: '42rem', marginTop: '0.35rem' }}>
            Sem ideas ainda para esta workspace. Rode Run Research + Run Daily Engine (MOCK) para gerar
            tópicos, ou clique "Nova idea rápida" (POST /api/ideas a partir do último tópico).
          </p>
        ) : null}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '1rem', alignItems: 'flex-end' }}>
          <label className="fine" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', minWidth: '24rem' }}>
            Script (para Approve / Production)
            <select
              value={selectedScriptId}
              onChange={(e) => setSelectedScriptId(e.target.value)}
              style={{ padding: '0.55rem 0.75rem' }}
            >
              <option value="">— selecionar script —</option>
              {scripts.map((s) => (
                <option key={s.id} value={s.id}>
                  {isApprovedScript(s) ? '✓ ' : ''}[{s.status}/{s.qa_status}] {(s.hook || s.id).slice(0, 60)}
                </option>
              ))}
            </select>
          </label>
          <button
            className="btn btn-ghost"
            disabled={busy || !workspaceId || !selectedScriptId}
            onClick={approveScript}
          >
            Approve Script
          </button>
          <label className="fine" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <input
              type="checkbox"
              checked={regenerateProduction}
              onChange={(e) => setRegenerateProduction(e.target.checked)}
            />
            Regenerate (evita idempotent_skip)
          </label>
          <button
            className="btn btn-signal"
            disabled={busy || !workspaceId}
            onClick={runProduction}
            title="Platform fixo em YOUTUBE_SHORT. Só usa scripts approved OU (ready+qa passed) — nunca draft."
          >
            Run Production (YOUTUBE_SHORT)
          </button>
        </div>
        <p className="fine" style={{ maxWidth: '46rem', marginTop: '0.35rem' }}>
          Production nunca cai silenciosamente para um script draft: só roda com status <code>approved</code> ou{' '}
          <code>ready</code> + <code>qa_status=passed</code>. Sem <code>allowUnapproved</code>.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '1.25rem' }}>
          <button
            className="btn btn-ghost"
            disabled={busy || !workspaceId}
            onClick={async () => {
              if (!workspaceId) return
              setBusy(true)
              try {
                const ready = (snap?.contents || []).find((c) => c.status === 'qa' || c.status === 'published')
                const prod = findPublishableRun(productionRuns)
                const contentId = ready?.id || (prod as { content_id?: string } | undefined)?.content_id
                if (!contentId) {
                  setLog('Nenhum content READY_FOR_PUBLISH com visuais Comfy/library — rode Production primeiro')
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
            title="MOCK: simula analytics/winner detection. Não publica de verdade — use o Gate de publish (Fase 5.1) abaixo para o caminho real."
          >
            Feedback Loop (MOCK)
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
              .map((r) => {
                let resultProvider = ''
                try {
                  resultProvider = String(
                    (JSON.parse(String(r.result || '{}')) as { provider?: string }).provider || '',
                  )
                } catch {
                  resultProvider = ''
                }
                const provider = r.provider || resultProvider || '-'
                return `${r.created_at} | ${r.status} | ${r.platform || '-'} | provider=${provider} | cost=${r.estimated_cost_cents}¢ | tokens=${Number(r.tokens_input || 0) + Number(r.tokens_output || 0)}`
              })
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
                      stages?: Record<
                        string,
                        { ok?: boolean; provider?: string; library?: { hits?: number; misses?: number } }
                      >
                      factoryMetrics?: {
                        voiceProvider?: string | null
                        visualProvider?: string | null
                        composeProvider?: string | null
                        assetsReused?: number
                        assetsNew?: number
                        fallbackCount?: number
                        totalMs?: number
                      }
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
                const fm = result.factoryMetrics
                const voiceProvider = fm?.voiceProvider || result.stages?.VOICE?.provider || '-'
                const visualProvider = fm?.visualProvider || result.stages?.VISUALS?.provider || '-'
                const composeProvider = fm?.composeProvider || result.stages?.COMPOSING?.provider || '-'
                const libHits = fm?.assetsReused ?? result.stages?.VISUALS?.library?.hits ?? 0
                const libMisses = fm?.assetsNew ?? result.stages?.VISUALS?.library?.misses ?? 0
                const observability = `VOICE=${voiceProvider} · VISUALS=${visualProvider} (lib hits=${libHits}/misses=${libMisses}) · COMPOSING=${composeProvider}${fm ? ` · fallback=${fm.fallbackCount ?? 0} · totalMs=${fm.totalMs ?? '-'}` : ''}`
                return `${r.created_at} | ${r.status} | stage=${r.current_stage || '-'} | pkg=${r.package_status} | score=${r.quality_score ?? '-'}\n  ${timeline}\n  ${observability}`
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
              {(() => {
                const sel = selectedProduction as {
                  assets?: unknown[]
                  package?: { status?: string } | null
                  error?: string
                  result?: string
                  providers?: {
                    voice?: { status?: string; kokoro?: string; resolver?: string }
                    visual?: { status?: string; resolver?: string; comfy?: string }
                    ffmpeg?: string
                  }
                }
                let parsed: {
                  stages?: Record<
                    string,
                    { provider?: string; library?: { hits?: number; misses?: number } }
                  >
                  factoryMetrics?: Record<string, unknown>
                } = {}
                try {
                  parsed = JSON.parse(String(sel.result || '{}'))
                } catch {
                  parsed = {}
                }
                const voice = parsed.stages?.VOICE
                const visuals = parsed.stages?.VISUALS
                const composing = parsed.stages?.COMPOSING
                const lines = [
                  `Assets: ${Array.isArray(sel.assets) ? sel.assets.length : 0} · Package: ${String(sel.package?.status || '-')} · Error: ${String(sel.error || '-')}`,
                  `VOICE provider: ${voice?.provider || '-'}${sel.providers?.voice?.kokoro ? ` (kokoro=${sel.providers.voice.kokoro})` : ''}`,
                  `VISUALS provider: ${visuals?.provider || '-'} · library hits=${visuals?.library?.hits ?? 0} misses=${visuals?.library?.misses ?? 0}${sel.providers?.visual?.comfy ? ` (comfy=${sel.providers.visual.comfy})` : ''}`,
                  `COMPOSING provider: ${composing?.provider || '-'}`,
                  `ffmpeg: ${sel.providers?.ffmpeg || '-'}`,
                  `factoryMetrics: ${parsed.factoryMetrics ? JSON.stringify(parsed.factoryMetrics) : '-'}`,
                ]
                return lines.join('\n')
              })()}
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
                const params = new URLSearchParams({ workspaceId })
                if (isWorkspaceId(publishContentId)) params.set('contentId', publishContentId)
                const res = await fetch(`${API}/api/validation/preflight?${params}`).then((r) => r.json())
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

        <h3 style={{ marginTop: '1.5rem', fontFamily: 'var(--font-display)', letterSpacing: '-0.03em' }}>
          Gate de publish (Fase 5.1)
        </h3>
        <p className="fine" style={{ maxWidth: '40rem' }}>
          Use o <code>content_id</code> do production run (não o packageId). Ordem:{' '}
          <strong>Usar último READY_FOR_PUBLISH</strong> → dry-run → approve → open-window → forceReal →
          restore. Pacotes com <code>mock_visual</code> não aparecem aqui — precisam de ComfyUI (A1 ou PC).
        </p>
        {!isWorkspaceId(publishContentId) ? (
          <p className="fine" style={{ color: 'var(--signal, #b45309)', maxWidth: '40rem' }}>
            Content ID vazio — Dry-run / Approve / Publish REAL não têm alvo. Clique em{' '}
            <strong>Usar último READY_FOR_PUBLISH</strong> primeiro.
          </p>
        ) : null}
        {preflight && preflight.safe === false ? (
          <p className="fine" style={{ color: 'var(--signal, #b91c1c)', maxWidth: '40rem' }}>
            ⚠ Janela de publish ABERTA (kill switch off). Se não fores publicar agora, clique{' '}
            <strong>Restaurar safety defaults</strong> imediatamente.
          </p>
        ) : null}
        <label className="fine" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', maxWidth: '28rem' }}>
          Content ID para publish
          <input
            value={publishContentId}
            onChange={(e) => {
              setPublishContentId(e.target.value.trim())
              setDryRunOkForContentId(null)
            }}
            placeholder="uuid do content READY_FOR_PUBLISH"
            style={{ padding: '0.55rem 0.75rem' }}
          />
        </label>
        <p className="fine" style={{ marginTop: '0.35rem' }}>
          Dry-run:{' '}
          <strong>
            {dryRunOkForContentId && dryRunOkForContentId === publishContentId ? 'OK' : 'pendente/não-OK'}
          </strong>{' '}
          — Publish REAL fica desabilitado até rodar Dry-run report com sucesso para este content_id.
        </p>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
          <button
            type="button"
            className="btn btn-signal"
            disabled={busy || !workspaceId}
            onClick={async () => {
              if (!workspaceId) {
                setLog('❌ Seleccione um workspace antes.')
                return
              }
              setBusy(true)
              try {
                let ready = findPublishableRun(productionRuns)
                let id = String(ready?.content_id || '')
                // Fallback: lista filtrada / campo ausente — reconsulta a API
                if (!isWorkspaceId(id)) {
                  const listed = (await fetchJson(
                    `${API}/api/production/workspaces/${workspaceId}/runs`,
                  )) as { runs?: Array<Record<string, unknown>> }
                  ready = findPublishableRun(listed.runs)
                  id = String(ready?.content_id || '')
                }
                if (!isWorkspaceId(id) && ready?.id) {
                  const detail = (await fetchJson(`${API}/api/production/runs/${String(ready.id)}`)) as {
                    content_id?: string
                  }
                  id = String(detail.content_id || '')
                }
                if (!isWorkspaceId(id)) {
                  setLog(
                    '❌ Nenhum production run READY_FOR_PUBLISH com content_id.\n' +
                      '➡ Visuais Mock não são publicáveis. Confirme ComfyUI READY no strip (A1 ou ponte PC),\n' +
                      'rode Production (YOUTUBE_SHORT) até COMPLETED / READY_FOR_PUBLISH, depois tente de novo.\n' +
                      'Ver docs/COMFYUI_A1_VS_PC.md',
                  )
                  return
                }
                setPublishContentId(id)
                setDryRunOkForContentId(null)
                const params = new URLSearchParams({ workspaceId, contentId: id })
                const res = await fetchJson(`${API}/api/validation/preflight?${params}`)
                setPreflight(res as Record<string, unknown>)
                setLog(
                  `✅ Content ID preenchido: ${id}\n` +
                    `➡ Agora clique em "Dry-run report".\n\n` +
                    JSON.stringify(res, null, 2),
                )
              } catch (err) {
                setLog(`❌ Falha ao resolver READY_FOR_PUBLISH: ${err instanceof Error ? err.message : String(err)}`)
              } finally {
                setBusy(false)
              }
            }}
          >
            Usar último READY_FOR_PUBLISH
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            disabled={busy || !workspaceId}
            title={
              isWorkspaceId(publishContentId)
                ? 'Gera YouTube Pre-Publish Report (nunca faz upload)'
                : 'Preencha o Content ID (use "Usar último READY_FOR_PUBLISH")'
            }
            onClick={async () => {
              if (!workspaceId) {
                setLog('❌ Seleccione um workspace.')
                return
              }
              if (!isWorkspaceId(publishContentId)) {
                setLog(
                  '❌ Content ID vazio — o Dry-run precisa do UUID do content.\n' +
                    '➡ Clique primeiro em "Usar último READY_FOR_PUBLISH" (botão ao lado).\n' +
                    'Não use o productionRunId nem o packageId.',
                )
                return
              }
              setBusy(true)
              try {
                const res = await postJson(`${API}/api/validation/dry-run-report`, {
                  workspaceId,
                  contentId: publishContentId,
                  platform: 'YOUTUBE_SHORT',
                })
                if (!res.ok) {
                  setLog(describeApiResult(res))
                  setDryRunOkForContentId(null)
                  return
                }
                const validation = res.data.validation as
                  | { ok?: boolean; issues?: string[] }
                  | undefined
                const ok = validation?.ok === true
                setDryRunOkForContentId(ok ? publishContentId : null)
                const issues = validation?.issues || []
                const headline = ok
                  ? '✅ Dry-run OK — Publish REAL liberado para este content_id (ainda precisa Approve for publish + janela).'
                  : `❌ Dry-run bloqueado${issues.length ? `: ${issues.join(', ')}` : ''}.\n` +
                    `➡ packageOk=${String(res.data.packageOk)} · video=${String(res.data.video)} · ` +
                    `title=${String(res.data.title || '').slice(0, 80)}`
                setLog(`${headline}\n\n${JSON.stringify(res.data, null, 2)}`)
              } catch (err) {
                setDryRunOkForContentId(null)
                setLog(`❌ Dry-run falhou: ${err instanceof Error ? err.message : String(err)}`)
              } finally {
                setBusy(false)
              }
            }}
          >
            Dry-run report
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            disabled={busy || !workspaceId}
            onClick={async () => {
              if (!workspaceId) {
                setLog('❌ Seleccione um workspace.')
                return
              }
              if (!isWorkspaceId(publishContentId)) {
                setLog(
                  '❌ Content ID vazio.\n➡ Clique em "Usar último READY_FOR_PUBLISH" antes de Approve for publish.',
                )
                return
              }
              setBusy(true)
              try {
                const res = await postJson(`${API}/api/publishing/approve-for-publish`, {
                  workspaceId,
                  contentId: publishContentId,
                  approvedBy: 'operator@nexus',
                })
                setLog(describeApiResult(res))
                await refresh()
              } catch (err) {
                setLog(`❌ Approve for publish falhou: ${err instanceof Error ? err.message : String(err)}`)
              } finally {
                setBusy(false)
              }
            }}
          >
            Approve for publish
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            disabled={busy}
            onClick={async () => {
              setBusy(true)
              try {
                const res = await fetch(`${API}/api/validation/safety/open-window`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ confirm: 'OPEN_PUBLISH_WINDOW', maxPublicationsPerDay: 1 }),
                }).then((r) => r.json())
                setLog(JSON.stringify(res, null, 2))
                await refresh()
              } finally {
                setBusy(false)
              }
            }}
          >
            Abrir janela (1 vídeo)
          </button>
          <button
            type="button"
            className="btn btn-signal"
            disabled={
              busy ||
              !workspaceId ||
              !isWorkspaceId(publishContentId) ||
              dryRunOkForContentId !== publishContentId
            }
            title={
              dryRunOkForContentId !== publishContentId
                ? 'Rode "Dry-run report" com sucesso para este content_id antes de publicar REAL'
                : undefined
            }
            onClick={async () => {
              if (!workspaceId || !publishContentId) return
              if (
                !window.confirm(
                  'Publicar 1 YouTube Short REAL (forceReal)? Confirme dry-run ok e janela aberta.',
                )
              ) {
                return
              }
              setBusy(true)
              try {
                const res = await fetch(`${API}/api/publishing/run`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    workspaceId,
                    contentId: publishContentId,
                    platform: 'YOUTUBE_SHORT',
                    await: true,
                    forceReal: true,
                  }),
                }).then((r) => r.json())
                setLog(JSON.stringify(res, null, 2))
                const restored = await fetch(`${API}/api/validation/safety/restore-defaults`, {
                  method: 'POST',
                }).then((r) => r.json())
                setLog((prev) => `${prev}\n\n--- restore ---\n${JSON.stringify(restored, null, 2)}`)
                await refresh()
              } finally {
                setBusy(false)
              }
            }}
          >
            Publish REAL + restore
          </button>
        </div>

        <h2 style={{ marginTop: '2rem', fontFamily: 'var(--font-display)', letterSpacing: '-0.04em' }}>
          Connections
        </h2>
        <div className="action-row" style={{ marginBottom: '0.75rem' }}>
          <button
            type="button"
            className="btn"
            disabled={busy || !workspaceId}
            onClick={async () => {
              if (!workspaceId) return
              setBusy(true)
              try {
                const res = await fetch(`${API}/api/publishing/connections/youtube/start`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ workspaceId }),
                })
                const data = await res.json().catch(() => ({}))
                setLog(JSON.stringify(data, null, 2))
                if (!res.ok || !(data as { authorizeUrl?: string }).authorizeUrl) {
                  setApiOnline(res.ok)
                  return
                }
                window.open(
                  String((data as { authorizeUrl: string }).authorizeUrl),
                  '_blank',
                  'noopener,noreferrer',
                )
                await refresh()
              } catch (err) {
                setApiOnline(false)
                setLog(
                  `Falha ao iniciar OAuth (${API}): ${err instanceof Error ? err.message : String(err)}`,
                )
              } finally {
                setBusy(false)
              }
            }}
          >
            Conectar YouTube (OAuth)
          </button>
          <button
            type="button"
            className="btn secondary"
            disabled={busy || !workspaceId}
            onClick={async () => {
              if (!workspaceId) return
              setBusy(true)
              try {
                const res = await fetch(`${API}/api/publishing/connections/youtube/refresh`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ workspaceId }),
                }).then((r) => r.json())
                setLog(JSON.stringify(res, null, 2))
                await refresh()
              } finally {
                setBusy(false)
              }
            }}
          >
            Refresh token YouTube
          </button>
          <button
            type="button"
            className="btn secondary"
            disabled={busy || !workspaceId}
            onClick={async () => {
              if (!workspaceId) return
              setBusy(true)
              try {
                const conn = await fetch(
                  `${API}/api/publishing/connections?workspaceId=${workspaceId}`,
                ).then((r) => r.json())
                setConnections(conn)
                setLog(JSON.stringify(conn, null, 2))
              } finally {
                setBusy(false)
              }
            }}
          >
            Atualizar status conexões
          </button>
        </div>
        <div className="kit-grid">
          <pre>
            {((connections?.connections as Array<Record<string, unknown>>) || [])
              .map((c) => {
                const extra =
                  c.platform === 'YOUTUBE' && c.canRefresh != null
                    ? ` · refresh=${c.canRefresh ? 'yes' : 'no'}`
                    : ''
                return `${c.platform}: ${c.status || c.publisher}${c.lastVerifiedAt ? ` · verified ${c.lastVerifiedAt}` : ''}${extra}`
              })
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
