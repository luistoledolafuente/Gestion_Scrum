import { RefreshCw, Wifi, WifiOff } from 'lucide-react'

const time = (date) => date ? new Intl.DateTimeFormat('es', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(date) : '—'

export function SyncStatus({ refreshing, error, lastUpdated, onRefresh, compact = false }) {
  return <div className={`sync-status ${error ? 'sync-error' : ''} ${compact ? 'compact-sync' : ''}`}>
    <span className="sync-icon">{refreshing ? <RefreshCw className="spin-icon" size={14} /> : error ? <WifiOff size={14} /> : <Wifi size={14} />}</span>
    <div><strong>{refreshing ? 'Actualizando…' : error ? 'Reintentando conexión' : 'Información al día'}</strong><small>{refreshing ? 'Buscando cambios…' : error || `Última actualización: ${time(lastUpdated)}`}</small></div>
    {onRefresh && <button type="button" onClick={onRefresh} disabled={refreshing} aria-label="Actualizar ahora"><RefreshCw size={14} />{!compact && 'Actualizar ahora'}</button>}
  </div>
}
