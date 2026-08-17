import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiJson, readWorkspaceId, studioShell } from '../../studio/api'

const STEPS = [
  { id: 1, title: 'Workspace', help: 'Um espaço de trabalho guarda os teus Shorts.' },
  { id: 2, title: 'Conteúdo', help: 'Idioma e nicho vêm do workspace. Não precisas de schemas.' },
  { id: 3, title: 'IA', help: 'Gemini é o principal. Groq e Ollama são reservas.' },
  { id: 4, title: 'Voz', help: 'Kokoro gera a narração neste servidor. Sem contas externas.' },
  { id: 5, title: 'Visuais', help: 'Stock (Pexels/Pixabay) é o caminho normal. ComfyUI é opcional.' },
  { id: 6, title: 'YouTube', help: 'Liga o canal quando quiseres publicar. O vídeo pode ficar privado.' },
  { id: 7, title: 'Teste', help: 'Confirmamos FFmpeg, voz e fontes visuais sem criar um vídeo.' },
  { id: 8, title: 'Pronto', help: 'Podes criar um Short. A configuração avançada fica noutro sítio.' },
]

export function StudioSetup() {
  const [health, setHealth] = useState<Record<string, unknown> | null>(null)
  const [script, setScript] = useState<Record<string, unknown>>({})
  const [msg, setMsg] = useState('')
  const [step, setStep] = useState(1)

  async function refresh() {
    const data = await apiJson('/api/health/system')
    setHealth(data)
    setScript((data.script as Record<string, unknown>) || {})
  }

  useEffect(() => {
    refresh().catch((e: Error) => setMsg(e.message))
  }, [])

  async function createWorkspace() {
    const data = await apiJson('/api/workspaces', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Studio', email: `studio-${Date.now()}@cwm.local` }),
    })
    const id = String(data.workspaceId || data.id || '')
    if (id) {
      localStorage.setItem('cwm_workspace', id)
      setMsg('Workspace pronto.')
    } else setMsg(JSON.stringify(data))
  }

  const current = STEPS[step - 1]
  return (
    <main style={studioShell}>
      <h1>Configuração</h1>
      <p>Um passo de cada vez. Chaves de API nunca ficam no browser.</p>
      <p>
        Passo {step} de 8 — <strong>{current.title}</strong>
      </p>
      <p style={{ opacity: 0.8 }}>{current.help}</p>

      {step === 1 && (
        <section>
          <p>Estado: {readWorkspaceId() ? '✓ workspace definido' : '○ ainda não há workspace'}</p>
          <button type="button" onClick={() => createWorkspace().catch((e: Error) => setMsg(e.message))}>
            Criar workspace
          </button>
        </section>
      )}
      {step === 2 && (
        <section>
          <p>Estado: ✓ conteúdo em português por omissão</p>
          <p>Estilo e duração escolhem-se ao criar o Short.</p>
        </section>
      )}
      {step === 3 && (
        <section>
          <p>Principal: Gemini — {mark(script.gemini)}</p>
          <p>Reserva: Groq — {mark(script.groq)}</p>
          <p>Local: Ollama — {mark(script.ollama)}</p>
          <p>Em desenvolvimento, um gerador de teste preenche o roteiro se as APIs não estiverem ligadas.</p>
        </section>
      )}
      {step === 4 && (
        <section>
          <p>Kokoro — {mark(health?.kokoro)}</p>
          <p>Amostra de voz fica no Automation avançado. Aqui basta o estado.</p>
        </section>
      )}
      {step === 5 && (
        <section>
          <p>Asset Library — ✓</p>
          <p>Pexels — {mark(health?.pexels)}</p>
          <p>Pixabay — {mark(health?.pixabay)}</p>
          <p style={{ opacity: 0.75 }}>
            ComfyUI — {mark(health?.comfy)} (opcional, avançado, não é necessário para Shorts normais)
          </p>
        </section>
      )}
      {step === 6 && (
        <section>
          <p>YouTube — {mark(health?.youtube)}</p>
          <p>Visibilidade omissa: privado. Publicar só depois do QA.</p>
        </section>
      )}
      {step === 7 && (
        <section>
          <p>FFmpeg — {mark(health?.ffmpeg)}</p>
          <p>Base de dados — {mark(health?.database)}</p>
          <button
            type="button"
            onClick={() =>
              refresh()
                .then(() => setMsg('Ligação verificada.'))
                .catch((e: Error) => setMsg(e.message))
            }
          >
            Testar ligação
          </button>
        </section>
      )}
      {step === 8 && (
        <section>
          <p>Estás pronto para criar um Short.</p>
          <Link to="/studio/create">Criar Short</Link>
        </section>
      )}

      <p style={{ marginTop: 24 }}>
        <button type="button" disabled={step <= 1} onClick={() => setStep(step - 1)}>
          Anterior
        </button>{' '}
        <button type="button" disabled={step >= 8} onClick={() => setStep(step + 1)}>
          Seguinte
        </button>
      </p>
      {msg && <p>{msg}</p>}
    </main>
  )
}

function mark(value: unknown) {
  if (value === 'READY') return '✓ ligado'
  if (value === 'NOT_CONFIGURED') return '○ não configurado'
  if (value === 'ERROR') return '⚠ indisponível'
  return String(value || '…')
}
