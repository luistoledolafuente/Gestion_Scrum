import { AlertTriangle, CheckCircle2, X } from 'lucide-react'
import { useEffect } from 'react'

export function Toast({ message, onClose }) {
  useEffect(() => {
    if (!message) return undefined
    const timer = window.setTimeout(onClose, 3500)
    return () => window.clearTimeout(timer)
  }, [message, onClose])
  if (!message) return null
  const warning = message.toLowerCase().includes('no se pudo')
  return <div className={`toast ${warning ? 'toast-warning' : ''}`} role="status"><span>{warning ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}</span><div><strong>{warning ? 'Requiere atención' : 'Listo'}</strong><small>{message}</small></div><button onClick={onClose} aria-label="Cerrar"><X size={15} /></button></div>
}
