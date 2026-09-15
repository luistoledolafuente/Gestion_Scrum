import { Building2, Mail, Pencil, Phone, Plus, Trash2, Users } from 'lucide-react'
import { useCallback, useState } from 'react'
import { FormModal } from '../components/FormModal'
import { ErrorState, LoadingState } from '../components/LoadingState'
import { SyncStatus } from '../components/SyncStatus'
import { Toast } from '../components/Toast'
import { useAuth } from '../hooks/useAuth'
import { usePolling } from '../hooks/usePolling'
import { useToast } from '../hooks/useToast'
import { getErrorMessage } from '../services/api'
import { clientsService } from '../services/clients.service'

const emptyClient = { name: '', email: '', companyName: '', phone: '', notes: '' }

export function ClientsPage() {
  const { canEdit } = useAuth()
  const toast = useToast()
  const [editing, setEditing] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [action, setAction] = useState({ saving: false, error: '' })
  const fetchClients = useCallback(() => clientsService.getAll(), [])
  const polling = usePolling(fetchClients, 30000)
  const openCreate = () => { setEditing(null); setAction({ saving: false, error: '' }); setModalOpen(true) }
  const openEdit = (client) => { setEditing(client); setAction({ saving: false, error: '' }); setModalOpen(true) }
  const submit = async (event) => {
    event.preventDefault(); setAction({ saving: true, error: '' })
    const payload = Object.fromEntries(new FormData(event.currentTarget))
    try {
      if (editing) await clientsService.update(editing.id, payload)
      else await clientsService.create(payload)
      setModalOpen(false); await polling.refresh(); toast.showToast(editing ? 'Cliente actualizado correctamente.' : 'Cliente creado correctamente.')
    } catch (error) { setAction({ saving: false, error: getErrorMessage(error) }); return }
    setAction({ saving: false, error: '' })
  }
  const remove = async (client) => {
    if (!window.confirm(`¿Eliminar a ${client.name}? Esta acción solo es posible si no tiene proyectos asociados.`)) return
    try { await clientsService.remove(client.id); await polling.refresh(); toast.showToast('Cliente eliminado.') }
    catch (error) { setAction({ saving: false, error: getErrorMessage(error) }) }
  }
  if (polling.initialLoading) return <LoadingState label="Cargando clientes…" />
  if (!polling.data) return <ErrorState message={polling.error} onRetry={polling.refresh} />
  return <div className="page clients-page"><div className="page-heading"><div><span className="eyebrow">Directorio del workspace</span><h1>Clientes</h1><p>Consulta y mantén actualizados los datos de las personas y empresas con las que trabajas.</p></div><div className="heading-actions"><SyncStatus {...polling} onRefresh={polling.refresh} compact />{canEdit && <button className="primary-button" onClick={openCreate}><Plus size={16} />Nuevo cliente</button>}</div></div>{action.error && !modalOpen && <div className="inline-alert">{action.error}</div>}<section className="client-directory">{polling.data.map((client) => <article className="client-card" key={client.id}><div className="client-card-head"><span><Users size={19} /></span>{canEdit && <div><button onClick={() => openEdit(client)} aria-label={`Editar ${client.name}`}><Pencil size={14} /></button><button className="danger-icon" onClick={() => remove(client)} aria-label={`Eliminar ${client.name}`}><Trash2 size={14} /></button></div>}</div><h2>{client.name}</h2><p><Mail size={14} />{client.email}</p><p><Building2 size={14} />{client.companyName || 'Sin empresa registrada'}</p>{client.phone && <p><Phone size={14} />{client.phone}</p>}{client.notes && <p className="client-notes">{client.notes}</p>}<footer><span>{client._count?.projects || 0}</span> proyectos asociados</footer></article>)}{!polling.data.length && <div className="empty-state"><span><Users /></span><h3>Aún no hay clientes</h3><p>{canEdit ? 'Registra tu primer cliente para comenzar un proyecto.' : 'No hay clientes visibles en este espacio.'}</p></div>}</section><FormModal open={modalOpen} title={editing ? 'Editar cliente' : 'Nuevo cliente'} description="Mantén sus datos de contacto y empresa al día." onClose={() => setModalOpen(false)}><form className="entity-form" onSubmit={submit}><div className="form-grid"><label>Nombre<input name="name" required defaultValue={(editing || emptyClient).name} /></label><label>Correo<input name="email" type="email" required defaultValue={(editing || emptyClient).email} /></label><label>Empresa <span>(opcional)</span><input name="companyName" defaultValue={(editing || emptyClient).companyName || ''} /></label><label>Teléfono <span>(opcional)</span><input name="phone" type="tel" defaultValue={(editing || emptyClient).phone || ''} /></label><label className="full-field">Notas internas <span>(opcional)</span><textarea name="notes" rows="4" defaultValue={(editing || emptyClient).notes || ''} placeholder="Preferencias, contexto comercial o datos relevantes" /></label></div>{action.error && <div className="form-error">{action.error}</div>}<footer><button type="button" className="ghost-button" onClick={() => setModalOpen(false)}>Cancelar</button><button className="primary-button" disabled={action.saving}>{action.saving ? 'Guardando…' : 'Guardar cambios'}</button></footer></form></FormModal><Toast message={toast.message} onClose={toast.dismiss} /></div>
}
