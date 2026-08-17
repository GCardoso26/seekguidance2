import { Link } from 'react-router-dom'
import { Layout } from '../components/Layout'

const CHECKOUT_URL = import.meta.env.VITE_CHECKOUT_MACHINE_URL || '#'

export function Upsell() {
  return (
    <Layout>
      <section className="shell offer-hero fade-up">
        <p className="brand-mark">
          NEXUS <span>IA</span>
        </p>
        <h1>AI Content Machine</h1>
        <p className="promise" style={{ maxWidth: '36rem' }}>
          A fábrica completa: pesquisa, banco de ideias, roteiros, produção dark,
          automações n8n, calendário, templates e painel de métricas.
        </p>
        <p className="price">
          R$397 <small>upgrade</small>
        </p>
        <ul className="checklist">
          <li>Sistema de pesquisa + taxonomia A/B/C</li>
          <li>Prompts avançados e geração de roteiro</li>
          <li>Playbook de produção sem rosto</li>
          <li>Workflows n8n prontos para importar</li>
          <li>Painel views → cliques → leads → vendas</li>
          <li>Playbook de monetização + afiliados</li>
        </ul>
        <a className="btn btn-signal" href={CHECKOUT_URL}>
          Quero a Content Machine
        </a>
        <p className="fine" style={{ marginTop: '1rem' }}>
          4 vendas de R$397 = R$1.588. Você não precisa de centenas de clientes.
        </p>
        <p style={{ marginTop: '2rem' }}>
          <Link to="/oferta">Agora não — continuar com o Starter</Link>
        </p>
      </section>
    </Layout>
  )
}
