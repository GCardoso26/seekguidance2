import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiJson, readWorkspaceId, studioShell } from '../../studio/api'

export function StudioCreate() {
  const nav = useNavigate()
  const [topic, setTopic] = useState('')
  const [style, setStyle] = useState('educational')
  const [durationSec, setDurationSec] = useState(40)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const workspaceId = readWorkspaceId()
    if (!workspaceId) {
      nav('/studio/setup')
      return
    }
    setBusy(true)
    setError('')
    try {
      const created = await apiJson('/api/shorts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId, topic, style, durationSec, language: 'pt-BR' }),
      })
      const id = String(created.productionRunId || '')
      if (id) nav(`/studio/production/${id}`)
      else setError(JSON.stringify(created))
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main style={studioShell}>
      <h1>Criar Short</h1>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12, maxWidth: 480 }}>
        <label>
          Tema
          <input
            required
            minLength={3}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Por que IA sem sistema custa tempo"
            style={{ width: '100%', padding: 10 }}
          />
        </label>
        <label>
          Estilo
          <select value={style} onChange={(e) => setStyle(e.target.value)}>
            <option value="educational">Educativo</option>
            <option value="story">História</option>
            <option value="list">Lista</option>
          </select>
        </label>
        <label>
          Duração
          <select value={durationSec} onChange={(e) => setDurationSec(Number(e.target.value))}>
            <option value={30}>30s</option>
            <option value={40}>30–60s (40s)</option>
            <option value={60}>60s</option>
          </select>
        </label>
        <p>Idioma: Português · Voz: padrão · Visual: stock editorial</p>
        <button type="submit" disabled={busy}>
          {busy ? 'A gerar…' : 'Gerar Short'}
        </button>
        {error && <p style={{ color: '#c44c03' }}>{error}</p>}
      </form>
    </main>
  )
}
