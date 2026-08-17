import { Link } from 'react-router-dom'
import { Layout } from '../components/Layout'

export function Kit() {
  return (
    <Layout>
      <section className="shell page-block fade-up">
        <p className="brand-mark">
          NEXUS <span>IA</span>
        </p>
        <h1>AI Income Starter Kit — Lite</h1>
        <p className="promise" style={{ maxWidth: '36rem' }}>
          Entrega imediata. Use hoje. Quando quiser a versão completa (100 prompts,
          30 roteiros, calendário, automações), vá para o Starter Kit.
        </p>

        <div className="kit-grid" style={{ marginTop: '2rem' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.04em' }}>
              Checklist 7 dias
            </h2>
            <pre>{`Dia 1 — Avatar, promessa, CTA, 50 ideias
Dia 2 — Landing, checkout, produto, sequência
Dia 3 — 30 vídeos no formato HOOK→CTA
Dia 4–7 — 5/dia × 3 plataformas
Dia 8 — Classificar A/B/C e matar os C`}</pre>
          </div>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.04em' }}>
              Prompt 1→30
            </h2>
            <pre>{`Aja como estrategista de conteúdo dark da NEXUS IA.
Ideia: [COLE A IDEIA]
Gere 30 derivados substancialmente novos:
hooks, roteiros curtos, carrossel, thread, pin, parte 2, comparativo, FAQ.
CTA: "Peguei os prompts que uso e deixei no link da bio."
Não copie IP; reorganize e reinterpretar.`}</pre>
          </div>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.04em' }}>
              Roteiro #01
            </h2>
            <pre>{`HOOK: Você provavelmente está usando o ChatGPT errado.
PROBLEMA: Pedir "me dá ideias" gera lixo genérico.
INSIGHT: ChatGPT precisa de papel, restrição e formato.
SOLUÇÃO: Mostre 5 usos (hook, calendário, oferta…).
CTA: Kit com prompts no link da bio.`}</pre>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '2rem' }}>
          <Link className="btn btn-signal" to="/oferta">
            Quero o kit completo R$67
          </Link>
          <Link className="btn btn-ghost" to="/upsell">
            Ver AI Content Machine
          </Link>
        </div>
      </section>
    </Layout>
  )
}
