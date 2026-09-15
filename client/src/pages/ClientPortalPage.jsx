import { ShieldCheck, Sparkles } from 'lucide-react'
import { useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { ClientStatusCard } from '../components/ClientStatusCard'
import { ErrorState, LoadingState } from '../components/LoadingState'
import { SyncStatus } from '../components/SyncStatus'
import { usePolling } from '../hooks/usePolling'
import { clientPortalService } from '../services/clientPortal.service'

export function ClientPortalPage() {
  const { token } = useParams()
  const fetchPortal = useCallback(() => clientPortalService.getByToken(token), [token])
  const polling = usePolling(fetchPortal, 45000)
  const data = polling.data
  if (polling.initialLoading) return <div className="portal-shell"><LoadingState label="Cargando actualización del proyecto…" /></div>
  if (!data) return <div className="portal-shell"><ErrorState message={polling.error} onRetry={polling.refresh} /></div>
  return <div className="portal-shell">
    <header className="portal-header"><div className="brand"><span className="brand-mark"><Sparkles size={18} /></span><span>Momentum</span></div><div><ShieldCheck size={17} />Portal seguro · Solo lectura</div></header>
    <main className="portal-content"><div className="portal-welcome"><div><span className="eyebrow">Actualización para</span><h2>{data.project.client.companyName || data.project.client.name}</h2></div><SyncStatus {...polling} onRefresh={polling.refresh} /></div><ClientStatusCard data={data} /></main>
    <footer className="portal-footer">Este espacio resume el avance compartido por tu equipo de proyecto.</footer>
  </div>
}
