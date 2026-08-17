import { Link, Outlet } from 'react-router-dom'

export function StudioLayout() {
  return (
    <div style={{ minHeight: '100vh', background: '#e8f0f2' }}>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem 1.5rem',
          borderBottom: '1px solid rgba(14,26,36,0.12)',
          background: '#f7fbfc',
        }}
      >
        <Link to="/studio" style={{ fontWeight: 700, color: '#084f4f', textDecoration: 'none' }}>
          CWM Studio
        </Link>
        <nav style={{ display: 'flex', gap: '1rem', fontSize: 14 }}>
          <Link to="/studio/create">Criar Short</Link>
          <Link to="/studio/setup">Configuração</Link>
          <Link to="/app/automation" style={{ opacity: 0.65 }}>
            Avançado
          </Link>
        </nav>
      </header>
      <Outlet />
    </div>
  )
}
