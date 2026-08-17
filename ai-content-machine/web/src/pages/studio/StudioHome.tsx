import type { CSSProperties } from 'react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiJson, readWorkspaceId, studioShell } from '../../studio/api'

export function StudioHome() {
  const workspaceId = readWorkspaceId()
  const [data, setData] = useState<Record<string, unknown> | null>(null)
  const [health, setHealth] = useState<Record<string, unknown> | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    apiJson('/api/health/system')
      .then(setHealth)
      .catch((e: Error) => setError(e.message))
    if (!workspaceId) return
    apiJson(`/api/studio/home?workspaceId=${workspaceId}`)
      .then(setData)
      .catch((e: Error) => setError(e.message))
  }, [workspaceId])

  const production = (data?.production || {}) as Record<string, number>
  const attention = (data?.attention as Array<Record<string, unknown>>) || []
  const recent = (data?.recent as Array<Record<string, unknown>>) || []
  const metrics = (data?.metrics || {}) as Record<string, number>

  return (
    <main style={studioShell}>
      <p style={{ color: '#084f4f', marginBottom: 8 }}>{String(data?.greeting || 'Olá.')}</p>
      <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 36, margin: '0 0 1.5rem' }}>CWM</h1>

      <section style={card}>
        <h2>Criar novo Short</h2>
        <p>Informe um tema. O resto acontece automaticamente.</p>
        <Link to="/studio/create" style={btn}>
          + Criar Short
        </Link>
      </section>

      <section style={card}>
        <h2>Produção</h2>
        <p>
          {production.producing || 0} em produção · {production.waitingAssets || 0} aguardando assets ·{' '}
          {production.awaitingApproval || 0} aguardando aprovação · {production.readyToPublish || 0} prontos
          para publicar
        </p>
        {!workspaceId && (
          <p>
            Configure um workspace em <Link to="/studio/setup">Configuração</Link>.
          </p>
        )}
      </section>

      <section style={card}>
        <h2>Precisa da sua atenção</h2>
        {attention.length === 0 && <p>Nada pendente.</p>}
        {attention.map((row) => (
          <div key={String(row.production_id) + String(row.scene)} style={{ marginBottom: 12 }}>
            <strong>
              Cena {String(row.scene)} precisa de um visual
            </strong>
            <p>{String(row.scene_description || row.visual_intent || '')}</p>
            <Link to={`/studio/production/${row.production_id}`}>Resolver</Link>
          </div>
        ))}
        {error && <p style={{ color: '#c44c03' }}>{error}</p>}
      </section>

      <section style={card}>
        <h2>Sistema</h2>
        <HealthLine label="FFmpeg" value={health?.ffmpeg} />
        <HealthLine label="Kokoro" value={health?.kokoro} />
        <HealthLine label="Pexels" value={health?.pexels} />
        <HealthLine label="Pixabay" value={health?.pixabay} />
        <HealthLine label="YouTube" value={health?.youtube} />
        <p style={{ opacity: 0.7, fontSize: 13 }}>ComfyUI é opcional e não é necessário para Shorts normais.</p>
        <HealthLine label="ComfyUI (opcional)" value={health?.comfy} />
      </section>

      <section style={card}>
        <h2>Métricas</h2>
        <p>
          {metrics.videosCreated || 0} criados · {metrics.videosRendered || 0} renderizados ·{' '}
          {metrics.videosPublished || 0} publicados
        </p>
        <p>
          Reuso da biblioteca: {Math.round((metrics.assetReuseRate || 0) * 100)}% ·{' '}
          {metrics.manualAssetRequests || 0} pedidos manuais
        </p>
      </section>

      <section style={card}>
        <h2>Últimos vídeos</h2>
        {recent.map((r) => (
          <p key={String(r.id)}>
            <Link to={`/studio/production/${r.id}`}>{String(r.id).slice(0, 8)}</Link> · {String(r.status)} ·{' '}
            {String(r.package_status)}
          </p>
        ))}
      </section>
    </main>
  )
}

function HealthLine({ label, value }: { label: string; value: unknown }) {
  const ok = value === 'READY'
  return (
    <p>
      {ok ? '✓' : '○'} {label}
      {ok ? '' : value === 'NOT_CONFIGURED' ? ' — não configurado' : ''}
    </p>
  )
}

const card: CSSProperties = {
  background: '#f7fbfc',
  border: '1px solid rgba(14,26,36,0.12)',
  borderRadius: 16,
  padding: '1.25rem 1.4rem',
  marginBottom: '1rem',
}

const btn: CSSProperties = {
  display: 'inline-block',
  marginTop: 8,
  background: '#0b6e6e',
  color: '#fff',
  padding: '0.7rem 1.1rem',
  borderRadius: 999,
  textDecoration: 'none',
  fontWeight: 600,
}
