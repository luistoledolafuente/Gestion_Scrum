import { X } from 'lucide-react'
import { useEffect } from 'react'

export function FormModal({ open, title, description, children, onClose }) {
  useEffect(() => {
    if (!open) return undefined
    const closeOnEscape = (event) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [open, onClose])

  if (!open) return null
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className="form-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <header><div><h2 id="modal-title">{title}</h2><p>{description}</p></div><button type="button" className="icon-button" onClick={onClose} aria-label="Cerrar"><X size={19} /></button></header>
      {children}
    </section>
  </div>
}
