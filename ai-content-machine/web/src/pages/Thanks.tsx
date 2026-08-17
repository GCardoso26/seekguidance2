import { Link } from 'react-router-dom'
import { Layout } from '../components/Layout'

export function Thanks() {
  const leadRaw = sessionStorage.getItem('nexus_lead')
  const lead = leadRaw ? (JSON.parse(leadRaw) as { name?: string }) : null

  return (
    <Layout>
      <section className="shell page-block fade-up">
        <p className="brand-mark">
          NEXUS <span>IA</span>
        </p>
        <h1>{lead?.name ? `${lead.name}, ` : ''}seu kit está pronto.</h1>
        <p className="promise" style={{ maxWidth: '34rem' }}>
          Baixe a versão lite e grave o roteiro #01 hoje. Depois, se quiser o sistema
          completo, o Starter Kit de R$67 está um clique abaixo.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '1.5rem' }}>
          <Link className="btn btn-signal" to="/kit">
            Abrir kit gratuito
          </Link>
          <Link className="btn btn-ghost" to="/oferta">
            Quero o Starter Kit R$67
          </Link>
        </div>

        <div className="split-list" style={{ marginTop: '3rem' }}>
          <article>
            <h3>Próxima ação</h3>
            <p>Publique 1 vídeo com CTA “kit no link da bio”.</p>
          </article>
          <article>
            <h3>WhatsApp / e-mail</h3>
            <p>Você entra na sequência de execução (não de motivação).</p>
          </article>
          <article>
            <h3>Upgrade</h3>
            <p>AI Content Machine (R$397) aparece quando fizer sentido escalar.</p>
          </article>
        </div>
      </section>
    </Layout>
  )
}
