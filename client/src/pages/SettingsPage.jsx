import { CalendarCheck, CircleCheckBig, ExternalLink, Link2, ShieldCheck, Unplug, UserRound } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { SyncStatus } from '../components/SyncStatus'
import { Toast } from '../components/Toast'
import { useAuth } from '../hooks/useAuth'
import { usePolling } from '../hooks/usePolling'
import { useToast } from '../hooks/useToast'
import { getErrorMessage } from '../services/api'
import { googleIntegrationService } from '../services/googleIntegration.service'

export function SettingsPage() {
  const { user } = useAuth()
  const { message, showToast, dismiss } = useToast()
  const [actionError, setActionError] = useState('')
  const [working, setWorking] = useState(false)
  const fetchStatus = useCallback(() => googleIntegrationService.status(), [])
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
  const connection = polling.data
  return <div className="page settings-page"><div className="page-heading"><div><span className="eyebrow">Cuenta y servicios</span><h1>Configuración</h1><p>Administra tu perfil y las integraciones de tu cuenta.</p></div><SyncStatus {...polling} onRefresh={polling.refresh} compact /></div>{actionError && <div className="inline-alert">{actionError}</div>}<div className="settings-grid"><section className="panel settings-card"><div className="settings-card-title"><span><UserRound /></span><div><h2>Perfil</h2><p>Información de tu cuenta</p></div></div><div className="profile-summary">{user.pictureUrl ? <img src={user.pictureUrl} alt="" referrerPolicy="no-referrer" /> : <span>{user.name.slice(0, 2).toUpperCase()}</span>}<div><strong>{user.name}</strong><small>{user.email}</small></div></div><div className="settings-detail"><ShieldCheck size={16} /><span>Sesión protegida mediante cookie segura</span></div>{user.workspaces?.[0] && <div className="settings-detail"><CircleCheckBig size={16} /><span>{user.workspaces[0].name} · {user.workspaces[0].role}</span></div>}</section><section className="panel settings-card integration-card"><div className="settings-card-title"><span><CalendarCheck /></span><div><h2>Google Calendar</h2><p>Crea reuniones en tu propia cuenta</p></div></div>{connection?.connected ? <><div className="connection-status connected"><CircleCheckBig size={18} /><div><strong>Conectado</strong><small>{connection.email}</small></div></div><p className="settings-copy">Las reuniones que organices pueden sincronizarse con este calendario y generar enlaces únicos de Google Meet.</p><button className="secondary-button disconnect-button" onClick={disconnect} disabled={working}><Unplug size={15} />{working ? 'Desconectando…' : 'Desconectar'}</button></> : <><div className="connection-status"><Link2 size={18} /><div><strong>Sin conectar</strong><small>Funcionalidad opcional</small></div></div><p className="settings-copy">Puedes seguir utilizando el calendario interno. Conecta Google cuando quieras sincronizar reuniones y crear Meet.</p><button className="primary-button" onClick={connect} disabled={working}><span>{working ? 'Preparando…' : 'Conectar Google Calendar'}</span><ExternalLink size={15} /></button></>}</section></div><Toast message={message} onClose={dismiss} /></div>
}
