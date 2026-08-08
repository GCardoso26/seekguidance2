import { Layout } from '../components/Layout'
import { LeadForm } from '../components/LeadForm'

export function Landing() {
  return (
    <Layout>
      <section className="shell hero">
        <div className="hero-copy">
          <p className="brand-mark fade-up">
            NEXUS <span>IA</span>
          </p>
          <h1 className="fade-up-delay">
            IA que <em>economiza tempo</em> e abre renda.
          </h1>
          <p className="promise fade-up-late">
            Baixe o AI Income Starter Kit gratuito e transforme ferramentas de IA em
            conteúdo curto com CTA — sem aparecer no vídeo.
          </p>
          <div className="fade-up-late">
            <LeadForm />
          </div>
        </div>

        <aside className="hero-visual" aria-label="Diagrama do funil NEXUS">
          <div>
            <p className="label">Fábrica de distribuição</p>
            <p className="big">1 roteiro → 12 formatos → 1 funil</p>
          </div>
          <svg viewBox="0 0 360 160" role="img" aria-label="Fluxo vídeo para venda">
            <path className="flow" d="M20 40 H120 V90 H220 V40 H340" />
            <text x="20" y="28" fill="#F7FBFC" fontSize="14" fontFamily="IBM Plex Sans, sans-serif">
              Vídeo
            </text>
            <text x="120" y="118" fill="#F7FBFC" fontSize="14" fontFamily="IBM Plex Sans, sans-serif">
              Bio
            </text>
            <text x="220" y="28" fill="#F7FBFC" fontSize="14" fontFamily="IBM Plex Sans, sans-serif">
              Lead
            </text>
            <text x="300" y="28" fill="#E85D04" fontSize="14" fontFamily="IBM Plex Sans, sans-serif">
              Venda
            </text>
          </svg>
        </aside>
      </section>

      <section className="shell section">
        <h2>O que você recebe agora</h2>
        <p className="lead">
          Versão lite do kit: prompts, ideias, roteiros e um checklist de 7 dias para
          ligar a máquina.
        </p>
        <div className="split-list">
          <article>
            <h3>25 prompts</h3>
            <p>Pesquisa, roteiro, derivação, oferta e produtividade.</p>
          </article>
          <article>
            <h3>10 ideias + 5 roteiros</h3>
            <p>Formato HOOK → PROBLEMA → INSIGHT → SOLUÇÃO → CTA.</p>
          </article>
          <article>
            <h3>Plano de 7 dias</h3>
            <p>Construir → atacar → medir. Sem prospecção fria.</p>
          </article>
        </div>
      </section>

      <section className="shell section">
        <h2>Como o tráfego vira venda</h2>
        <p className="lead">
          O conteúdo procura compradores. Uma infraestrutura. Três ângulos de audiência.
        </p>
        <div className="flow-strip">
          <div>
            <strong>Shorts</strong>
            <span>YouTube</span>
          </div>
          <div>
            <strong>TikTok</strong>
            <span>Reach rápido</span>
          </div>
          <div>
            <strong>Reels</strong>
            <span>Instagram</span>
          </div>
          <div>
            <strong>Pins</strong>
            <span>Pinterest</span>
          </div>
          <div>
            <strong>Funil</strong>
            <span>Kit → R$67 → R$397</span>
          </div>
        </div>
      </section>
    </Layout>
  )
}
