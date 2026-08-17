import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

type Props = {
  source?: string
  cta?: string
}

export function LeadForm({ source = 'landing', cta = 'Quero o kit gratuito' }: Props) {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (!email.includes('@')) {
      setError('Informe um e-mail válido.')
      return
    }
    setLoading(true)

    const webhook = import.meta.env.VITE_N8N_LEAD_WEBHOOK as string | undefined
    const payload = { name, email, source, createdAt: new Date().toISOString() }

    try {
      if (webhook) {
        await fetch(webhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        const leads = JSON.parse(localStorage.getItem('nexus_leads') || '[]')
        leads.push(payload)
        localStorage.setItem('nexus_leads', JSON.stringify(leads))
      }
      sessionStorage.setItem('nexus_lead', JSON.stringify(payload))
      navigate('/obrigado')
    } catch {
      setError('Não foi possível enviar agora. Tente de novo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="hero-form" onSubmit={onSubmit}>
      <div className="row">
        <label className="field">
          <span>Nome</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Como te chamamos"
            autoComplete="name"
          />
        </label>
        <label className="field">
          <span>E-mail</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@email.com"
            autoComplete="email"
          />
        </label>
      </div>
      <button className="btn btn-signal" type="submit" disabled={loading}>
        {loading ? 'Enviando…' : cta}
      </button>
      {error ? <p className="fine" style={{ color: 'var(--signal)' }}>{error}</p> : null}
      <p className="fine">Sem spam. Você recebe o kit e o sistema de conteúdo.</p>
    </form>
  )
}
