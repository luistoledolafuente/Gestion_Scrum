import { CalendarCheck, CircleCheckBig, ExternalLink, Link2, ShieldCheck, Trash2, Unplug, UserPlus, UserRound, Users } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { SyncStatus } from '../components/SyncStatus'
import { Toast } from '../components/Toast'
import { useAuth } from '../hooks/useAuth'
import { usePolling } from '../hooks/usePolling'
import { useToast } from '../hooks/useToast'
import { getErrorMessage } from '../services/api'
import { googleIntegrationService } from '../services/googleIntegration.service'
import { workspacesService } from '../services/workspaces.service'

export function SettingsPage() {
  const { user, activeWorkspace, canEdit } = useAuth()
  const { message, showToast, dismiss } = useToast()
  const [actionError, setActionError] = useState('')
  const [working, setWorking] = useState(false)
  const fetchStatus = useCallback(() => Promise.all([googleIntegrationService.status(), workspacesService.members()]).then(([connection, members]) => ({ connection, members })), [])
  const polling = usePolling(fetchStatus, 60000)
  useEffect(() => { if (new URLSearchParams(window.location.search).get('calendar') === 'connected') showToast('Google Calendar se conectó correctamente.') }, [showToast])
  const connect = async () => {
    setWorking(true); setActionError('')
    try { const { url } = await googleIntegrationService.connect(); window.location.assign(url) }
    catch (error) { setActionError(getErrorMessage(error)); setWorking(false) }
  }
  const disconnect = async () => {
    if (!window.confirm('¿Desconectar Google Calendar? Las reuniones internas no se eliminarán.')) return
    setWorking(true); setActionError('')
    try { await googleIntegrationService.disconnect(); await polling.refresh(); showToast('Google Calendar fue desconectado.') }
    catch (error) { setActionError(getErrorMessage(error)) }
    finally { setWorking(false) }
  }
  const connection = polling.data?.connection
  const members = polling.data?.members || []
  const canManageMembers = activeWorkspace?.role === 'OWNER' || activeWorkspace?.role === 'ADMIN'
  const addMember = async (event) => {
    event.preventDefault(); setWorking(true); setActionError('')
    const form = event.currentTarget
    try { await workspacesService.addMember(Object.fromEntries(new FormData(form))); form.reset(); await polling.refresh(); showToast('Acceso al workspace concedido.') }
    catch (error) { setActionError(getErrorMessage(error)) }
    finally { setWorking(false) }
  }
  const changeRole = async (memberId, role) => {
    setWorking(true); setActionError('')
    try { await workspacesService.updateMember(memberId, role); await polling.refresh(); showToast('Rol actualizado.') }
    catch (error) { setActionError(getErrorMessage(error)) }
    finally { setWorking(false) }
  }
  const removeMember = async (member) => {
    if (!window.confirm(`¿Quitar el acceso de ${member.user.name}?`)) return
    setWorking(true); setActionError('')
    try { await workspacesService.removeMember(member.id); await polling.refresh(); showToast('Acceso eliminado.') }
    catch (error) { setActionError(getErrorMessage(error)) }
    finally { setWorking(false) }
  }
  return <div className="page settings-page"><div className="page-heading"><div><span className="eyebrow">Cuenta y servicios</span><h1>Configuración</h1><p>Administra tu perfil, el equipo y las integraciones.</p></div><SyncStatus {...polling} onRefresh={polling.refresh} compact /></div>{actionError && <div className="inline-alert">{actionError}</div>}<div className="settings-grid"><section className="panel settings-card"><div className="settings-card-title"><span><UserRound /></span><div><h2>Perfil</h2><p>Información de tu cuenta</p></div></div><div className="profile-summary">{user.pictureUrl ? <img src={user.pictureUrl} alt="" referrerPolicy="no-referrer" /> : <span>{user.name.slice(0, 2).toUpperCase()}</span>}<div><strong>{user.name}</strong><small>{user.email}</small></div></div><div className="settings-detail"><ShieldCheck size={16} /><span>Sesión protegida mediante cookie segura</span></div>{activeWorkspace && <div className="settings-detail"><CircleCheckBig size={16} /><span>{activeWorkspace.name} · {activeWorkspace.role === 'CLIENT' ? 'Solo lectura' : activeWorkspace.role}</span></div>}{!canEdit && <div className="readonly-notice">Tu acceso a este workspace es de solo lectura.</div>}</section><section className="panel settings-card integration-card"><div className="settings-card-title"><span><CalendarCheck /></span><div><h2>Google Calendar</h2><p>Crea reuniones en tu propia cuenta</p></div></div>{connection?.connected ? <><div className="connection-status connected"><CircleCheckBig size={18} /><div><strong>Conectado</strong><small>{connection.email}</small></div></div><p className="settings-copy">Las reuniones que organices pueden sincronizarse con este calendario y generar enlaces únicos de Google Meet.</p><button className="secondary-button disconnect-button" onClick={disconnect} disabled={working}><Unplug size={15} />{working ? 'Desconectando…' : 'Desconectar'}</button></> : <><div className="connection-status"><Link2 size={18} /><div><strong>Sin conectar</strong><small>Funcionalidad opcional</small></div></div><p className="settings-copy">Puedes seguir utilizando el calendario interno. Conecta Google cuando quieras sincronizar reuniones y crear Meet.</p><button className="primary-button" onClick={connect} disabled={working}><span>{working ? 'Preparando…' : 'Conectar Google Calendar'}</span><ExternalLink size={15} /></button></>}</section></div><section className="panel members-panel"><div className="settings-card-title"><span><Users /></span><div><h2>Personas con acceso</h2><p>Comparte {activeWorkspace?.name} y controla quién puede editar.</p></div></div>{canManageMembers && <form className="member-invite" onSubmit={addMember}><label>Correo de una cuenta registrada<input name="email" type="email" required placeholder="persona@empresa.com" /></label><label>Rol<select name="role" defaultValue="EDITOR"><option value="EDITOR">Editor</option><option value="CLIENT">Cliente · solo lectura</option><option value="ADMIN">Administrador</option></select></label><button className="primary-button" disabled={working}><UserPlus size={15} />Compartir workspace</button></form>}<div className="member-list">{members.map((member) => <div key={member.id}><span className="member-avatar">{member.user.pictureUrl ? <img src={member.user.pictureUrl} alt="" referrerPolicy="no-referrer" /> : member.user.name.slice(0, 2).toUpperCase()}</span><div><strong>{member.user.name}</strong><small>{member.user.email}</small></div>{canManageMembers && member.role !== 'OWNER' ? <select value={member.role === 'MEMBER' ? 'EDITOR' : member.role} disabled={working} onChange={(event) => changeRole(member.id, event.target.value)}><option value="ADMIN">Administrador</option><option value="EDITOR">Editor</option><option value="CLIENT">Cliente · lectura</option></select> : <span className="role-pill">{member.role === 'OWNER' ? 'Propietario' : member.role === 'CLIENT' ? 'Solo lectura' : 'Editor'}</span>}{canManageMembers && member.role !== 'OWNER' && <button className="member-remove" onClick={() => removeMember(member)} aria-label={`Quitar a ${member.user.name}`}><Trash2 size={14} /></button>}</div>)}</div></section><Toast message={message} onClose={dismiss} /></div>
}
