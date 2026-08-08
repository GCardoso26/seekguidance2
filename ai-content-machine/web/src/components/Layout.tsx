import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

export function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="shell topbar">
        <Link to="/" className="brand-mark">
          NEXUS <span>IA</span>
        </Link>
        <nav>
          <Link to="/oferta">Starter Kit</Link>
          <Link to="/upsell">Content Machine</Link>
          <Link to="/kit">Kit grátis</Link>
        </nav>
      </header>
      <main>{children}</main>
      <footer className="shell footer">
        <p>NEXUS IA — fábrica de distribuição, não um canal.</p>
        <p>Recicle informação. Não propriedade intelectual.</p>
      </footer>
    </>
  )
}
