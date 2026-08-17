import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { apiJson, studioShell } from '../../studio/api'

export function StudioProduction() {
  const { id } = useParams()
  const [run, setRun] = useState<Record<string, unknown> | null>(null)
  const [msg, setMsg] = useState('')

  async function load() {
    if (!id) return
    const data = await apiJson(`/api/shorts/${id}`)
    setRun(data)
  }

  useEffect(() => {
    load().catch((e: Error) => setMsg(e.message))
  }, [id])

  const requests = (run?.manualAssetRequests as Array<Record<string, unknown>>) || []
  const result = parseResult(run?.result)
  const stages = (result.stages || {}) as Record<string, { ok?: boolean }>
  const queries = (row: Record<string, unknown>) => {
    try {
      const q = row.search_queries
      return Array.isArray(q) ? q : JSON.parse(String(q || '[]'))
    } catch {
      return []
    }
  }

  async function onUpload(scene: number, file: File) {
    const b64 = await fileToBase64(file)
    await apiJson(`/api/production/runs/${id}/scenes/${scene}/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: b64, filename: file.name }),
    })
    setMsg('Asset enviado. A produção continua a partir daqui.')
    await load()
  }

  return (
    <main style={studioShell}>
      <h1>Short {String(id || '').slice(0, 8)}</h1>
      <p>
        Estado: {String(run?.status || '…')} · Pacote: {String(run?.package_status || '…')}
      </p>
      <p>
        {mark(stages.PLANNING)} Research/Script/Plan · {mark(stages.VOICE)} Voz · {mark(stages.VISUALS)} Assets ·{' '}
        {mark(stages.COMPOSING)} Render · {mark(stages.QA)} QA
      </p>
      {String(run?.status) === 'WAITING_ASSETS' && (
        <section>
          <h2>Precisamos da sua ajuda</h2>
          <p>Não encontrámos um visual adequado automaticamente.</p>
          {requests.map((row) => {
            const q = queries(row) as string[]
            const primary = q[0] || String(row.visual_intent || '')
            const pexels = `https://www.pexels.com/search/${encodeURIComponent(primary)}/`
            const pixabay = `https://pixabay.com/images/search/${encodeURIComponent(primary)}/`
            return (
              <div key={String(row.scene)} style={{ borderTop: '1px solid #ddd', paddingTop: 12, marginTop: 12 }}>
                <h3>Cena {String(row.scene)}</h3>
                <p>{String(row.scene_description || '')}</p>
                <p>
                  Busca sugerida: <code>{primary}</code>
                </p>
                <p>9:16 · mínimo 1080p · 4–6 segundos</p>
                <button type="button" onClick={() => navigator.clipboard.writeText(primary)}>
                  Copiar busca
                </button>{' '}
                <a href={pexels} target="_blank" rel="noreferrer">
                  Abrir Pexels
                </a>{' '}
                <a href={pixabay} target="_blank" rel="noreferrer">
                  Abrir Pixabay
                </a>
                <p>
                  Enviar asset:{' '}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) onUpload(Number(row.scene), f)
                    }}
                  />
                </p>
              </div>
            )
          })}
        </section>
      )}
      {msg && <p>{msg}</p>}
    </main>
  )
}

function mark(stage?: { ok?: boolean }) {
  if (stage?.ok) return '✓'
  if (stage && stage.ok === false) return '⚠'
  return '○'
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const r = String(reader.result || '')
      const comma = r.indexOf(',')
      resolve(comma >= 0 ? r.slice(comma + 1) : r)
    }
    reader.onerror = () => reject(reader.error || new Error('read_failed'))
    reader.readAsDataURL(file)
  })
}

function parseResult(raw: unknown): Record<string, unknown> {
  if (!raw) return {}
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as Record<string, unknown>
    } catch {
      return {}
    }
  }
  return typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
}
