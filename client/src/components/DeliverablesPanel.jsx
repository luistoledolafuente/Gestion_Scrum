import { Check, Circle, PackageCheck, Plus, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { getErrorMessage } from '../services/api'
import { projectsService } from '../services/projects.service'

const normalize = (items = []) => items.map((item, index) => typeof item === 'string'
  ? { id: `legacy-${index}`, title: item, completed: false, completedAt: null }
  : item)

export function DeliverablesPanel({ projectId, deliverables, canEdit, onRefresh, onNotify }) {
  const [items, setItems] = useState(() => normalize(deliverables))
  const [saving, setSaving] = useState(false)
  useEffect(() => setItems(normalize(deliverables)), [deliverables])
  const completed = useMemo(() => items.filter((item) => item.completed).length, [items])

  const persist = async (next, successMessage) => {
    const previous = items
    setItems(next)
    setSaving(true)
    try {
      await projectsService.update(projectId, { deliverables: next })
      await onRefresh()
      onNotify(successMessage)
    } catch (error) {
      setItems(previous)
      onNotify(`No se pudo actualizar: ${getErrorMessage(error)}`)
    } finally { setSaving(false) }
  }

  const add = async (event) => {
    event.preventDefault()
    const input = event.currentTarget.elements.title
    const title = input.value.trim()
    if (!title) return
    const id = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${items.length}`
    input.value = ''
    await persist([...items, { id, title, completed: false, completedAt: null }], 'Entregable añadido.')
  }

  const toggle = (id) => {
    const next = items.map((item) => item.id === id
      ? { ...item, completed: !item.completed, completedAt: item.completed ? null : new Date().toISOString() }
      : item)
    const selected = next.find((item) => item.id === id)
    persist(next, selected?.completed ? 'Entregable marcado como completado.' : 'Entregable marcado como pendiente.')
  }

  const remove = (id) => {
    if (!window.confirm('¿Eliminar este entregable del proyecto?')) return
    persist(items.filter((item) => item.id !== id), 'Entregable eliminado.')
  }

  return <section className="panel deliverables-panel">
    <div className="section-heading compact"><div><h2>Entregables</h2><p>Resultados compartidos con el cliente</p></div><span>{completed} de {items.length} listos</span></div>
    <div className="deliverables-progress"><span style={{ width: `${items.length ? (completed / items.length) * 100 : 0}%` }} /></div>
    <div className="deliverables-admin-list">
      {items.map((item) => <div className={item.completed ? 'is-complete' : ''} key={item.id}>
        <button className="deliverable-toggle" disabled={!canEdit || saving} onClick={() => toggle(item.id)} aria-label={item.completed ? `Marcar ${item.title} como pendiente` : `Completar ${item.title}`}>
          {item.completed ? <Check size={15} /> : <Circle size={15} />}
        </button>
        <div><strong>{item.title}</strong><small>{item.completed ? 'Completado' : 'Pendiente'}</small></div>
        {canEdit && <button className="deliverable-delete" disabled={saving} onClick={() => remove(item.id)} aria-label={`Eliminar ${item.title}`}><Trash2 size={15} /></button>}
      </div>)}
      {!items.length && <div className="empty-inline"><PackageCheck size={18} />Aún no hay entregables definidos.</div>}
    </div>
    {canEdit && <form className="deliverable-add" onSubmit={add}><input name="title" maxLength="160" required placeholder="Nuevo entregable…" /><button disabled={saving} className="tiny-button"><Plus size={14} />Añadir</button></form>}
  </section>
}
