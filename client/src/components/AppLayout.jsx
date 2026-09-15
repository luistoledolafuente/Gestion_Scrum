import { BarChart3, CalendarDays, ContactRound, FolderKanban, LayoutDashboard, LogOut, Search, Settings, Sparkles } from 'lucide-react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function AppLayout() {
  const navigate = useNavigate()
  const { user, logout, activeWorkspace, switchWorkspace } = useAuth()
  const signOut = async () => { await logout(); navigate('/login', { replace: true }) }
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark"><Sparkles size={18} /></span><span>Momentum</span></div>
        <nav>
          <NavLink to="/" end><LayoutDashboard size={19} />Resumen</NavLink>
          <NavLink to="/"><FolderKanban size={19} />Proyectos</NavLink>
          <NavLink to="/clients"><ContactRound size={19} />Clientes</NavLink>
          <NavLink to="/calendar"><CalendarDays size={19} />Calendario</NavLink>
          <NavLink to="/reports"><BarChart3 size={19} />Reportes</NavLink>
          <NavLink to="/settings"><Settings size={19} />Configuración</NavLink>
        </nav>
        <div className="workspace-switcher"><small>Espacio de trabajo</small><select aria-label="Espacio de trabajo activo" value={activeWorkspace?.id || ''} onChange={(event) => switchWorkspace(event.target.value)}>{user.workspaces.map((workspace) => <option key={workspace.id} value={workspace.id}>{workspace.name} · {workspace.role === 'CLIENT' ? 'Lectura' : workspace.role === 'EDITOR' || workspace.role === 'MEMBER' ? 'Editor' : workspace.role}</option>)}</select></div>
        <div className="sidebar-foot"><Link to="/settings" className="sidebar-user">{user.pictureUrl ? <img src={user.pictureUrl} alt="" referrerPolicy="no-referrer" /> : <span className="avatar">{user.name.slice(0, 2).toUpperCase()}</span>}<div><strong>{user.name}</strong><small>{activeWorkspace?.name || 'Workspace'}</small></div></Link><button onClick={signOut} aria-label="Cerrar sesión"><LogOut size={16} /></button></div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="mobile-brand"><span className="brand-mark"><Sparkles size={17} /></span>Momentum</div>
          <label className="search"><Search size={18} /><input aria-label="Buscar" placeholder="Buscar proyectos…" onChange={(event) => navigate(event.target.value ? `/?q=${encodeURIComponent(event.target.value)}` : '/')} /></label>
          <div className="topbar-meta"><span className="live-dot" />Todo sincronizado</div>
        </header>
        <main key={activeWorkspace?.id}><Outlet /></main>
      </div>
    </div>
  )
}
