import { Link } from 'react-router-dom'
import { Layout } from '../components/Layout'

const CHECKOUT_URL = import.meta.env.VITE_CHECKOUT_STARTER_URL || '/upsell'

export function Offer() {
  return (
    <Layout>
      <section className="shell offer-hero fade-up">
        <p className="brand-mark">
          NEXUS <span>IA</span>
        </p>
        <h1>AI Income Starter Kit</h1>
        <p className="promise" style={{ maxWidth: '36rem' }}>
          Um sistema pronto para transformar ferramentas de IA em conteúdo e
          oportunidades de renda. Sem curso interminável.
        </p>
        <p className="price">
          R$67 <small>pagamento único</small>
        </p>
        <ul className="checklist">
          <li>100 prompts organizados por uso</li>
          <li>30 ideias + 30 roteiros prontos</li>
          <li>Lista de ferramentas + calendário de 30 dias</li>
          <li>Modelos de páginas, CTAs e checklists</li>
          <li>Starter de automações (n8n)</li>
        </ul>
        <a className="btn btn-signal" href={CHECKOUT_URL}>
          Quero o Starter Kit
        </a>
        <p className="fine" style={{ marginTop: '1rem' }}>
          Após a compra, você verá o upgrade opcional AI Content Machine.
        </p>
        <p style={{ marginTop: '2rem' }}>
          <Link to="/">← Voltar ao kit gratuito</Link>
        </p>
      </section>
    </Layout>
  )
}
