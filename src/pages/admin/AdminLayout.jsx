import { NavLink, Outlet, Link, useLocation } from 'react-router-dom'
import AdminAuthGuard from '../../components/admin/AdminAuthGuard'
import { apiPost } from '../../lib/api'
import crest from '../../assets/vetorescudo.png'
import { NewsIcon, ShieldIcon, ChatIcon, BallIcon, ChartIcon } from '../../components/icons'

const TABS = [
  { to: '/admin/blog', label: 'Notícias', Icon: NewsIcon },
  { to: '/admin/times', label: 'Times', Icon: ShieldIcon },
  { to: '/admin/dino', label: 'Frases do Dino', Icon: ChatIcon },
  { to: '/admin/jogos', label: 'Próximos Jogos & Placar', Icon: BallIcon },
  { to: '/admin/tabela', label: 'Tabela Kings League', Icon: ChartIcon },
]

export default function AdminLayout() {
  const location = useLocation()
  const current = TABS.find((tab) => location.pathname.startsWith(tab.to))

  function handleLogout() {
    apiPost('/auth/logout.php', {}).finally(() => window.location.reload())
  }

  return (
    <AdminAuthGuard>
      <div className="admin-shell">
        <aside className="admin-sidebar">
          <div className="admin-sidebar-brand">
            <img src={crest} alt="Podpah Funkbol Clube" />
            <span>
              Painel
              <br />
              Podpah Funkbol
            </span>
          </div>

          <nav className="admin-sidebar-nav">
            {TABS.map((tab) => (
              <NavLink key={tab.to} to={tab.to} className={({ isActive }) => (isActive ? 'is-active' : '')}>
                <tab.Icon className="admin-sidebar-icon" />
                {tab.label}
              </NavLink>
            ))}
          </nav>

          <div className="admin-sidebar-footer">
            <Link to="/">← Voltar ao site</Link>
            <button type="button" onClick={handleLogout}>
              Sair
            </button>
          </div>
        </aside>

        <main className="admin-main">
          <div className="admin-page-header">
            <h1>{current?.label || 'Painel'}</h1>
          </div>
          <Outlet />
        </main>
      </div>
    </AdminAuthGuard>
  )
}
