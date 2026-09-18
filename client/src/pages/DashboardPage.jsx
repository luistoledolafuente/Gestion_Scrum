import { Activity, CircleCheckBig, FolderKanban, Plus, TimerReset, Users } from 'lucide-react'
import { useCallback, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FormModal } from '../components/FormModal'
import { ProjectList } from '../components/ProjectList'
import { ErrorState, LoadingState } from '../components/LoadingState'
import { SyncStatus } from '../components/SyncStatus'
import { Toast } from '../components/Toast'
import { usePolling } from '../hooks/usePolling'
import { useToast } from '../hooks/useToast'
import { useAuth } from '../hooks/useAuth'
import { getErrorMessage } from '../services/api'
import { clientsService } from '../services/clients.service'
import { projectsService } from '../services/projects.service'
import { sprintsService } from '../services/sprints.service'

export function DashboardPage() {
  const { canEdit, activeWorkspace } = useAuth()
  const [searchParams] = useSearchParams()
  const [modal, setModal] = useState('')
  const [action, setAction] = useState({ saving: false, error: '' })
  const toast = useToast()
  const fetchDashboard = useCallback(() => Promise.all([projectsService.getAll(), sprintsService.getAll(), clientsService.getAll()])
    .then(([projects, sprints, clients]) => ({ projects, sprints, clients })), [])
  const polling = usePolling(fetchDashboard, 30000)
  const data = polling.data
  const submitClient = async (event) => {
    event.preventDefault(); setAction({ saving: true, error: '' })
    const form = new FormData(event.currentTarget)
    try { await clientsService.create(Object.fromEntries(form)); setModal(''); await polling.refresh(); toast.showToast('Cliente creado correctamente.') }
    catch (error) { setAction({ saving: false, error: getErrorMessage(error) }); return }
    setAction({ saving: false, error: '' })
  }
  const submitProject = async (event) => {
    event.preventDefault(); setAction({ saving: true, error: '' })
    const form = new FormData(event.currentTarget)
    const payload = Object.fromEntries(form)
    payload.deliverables = payload.deliverables ? payload.deliverables.split('\n').map((title) => title.trim()).filter(Boolean).map((title) => ({ title, completed: false })) : []
    if (!payload.endDate) delete payload.endDate
    try { await projectsService.create(payload); setModal(''); await polling.refresh(); toast.showToast('Proyecto creado y dashboard actualizado.') }
    catch (error) { setAction({ saving: false, error: getErrorMessage(error) }); return }
    setAction({ saving: false, error: '' })
  }
  const openModal = (name) => { setAction({ saving: false, error: '' }); setModal(name) }
  if (polling.initialLoading) return <LoadingState label="Preparando tu dashboard…" />
  if (!data) return <ErrorState message={polling.error} onRetry={polling.refresh} />
  const active = data.projects.filter((project) => project.status === 'active').length
  const running = data.sprints.filter((sprint) => sprint.status === 'in_progress').length
  const doneItems = data.projects.flatMap((project) => project.backlogItems || []).filter((item) => item.status === 'done').length
  const query = (searchParams.get('q') || '').toLowerCase()
  const visibleProjects = data.projects.filter((project) => `${project.name} ${project.description} ${project.client?.name || ''} ${project.client?.companyName || ''}`.toLowerCase().includes(query))
  return <div className="page">
    <div className="page-heading"><div><span className="eyebrow">{activeWorkspace?.name || 'Workspace'}</span><h1>Buenos días, equipo</h1><p>Una vista clara del trabajo, las entregas y el ritmo actual.</p></div><div className="heading-actions"><SyncStatus {...polling} onRefresh={polling.refresh} compact />{canEdit && <><button className="secondary-button" onClick={() => openModal('client')}><Users size={16} />Nuevo cliente</button><button className="primary-button" onClick={() => openModal('project')}><Plus size={17} />Nuevo proyecto</button></>}</div></div>
    <section className="stat-grid" id="metrics">
      <article><span className="stat-icon purple"><FolderKanban /></span><div><small>Proyectos activos</small><strong>{active}</strong><em>de {data.projects.length} totales</em></div></article>
      <article><span className="stat-icon blue"><TimerReset /></span><div><small>Sprints en curso</small><strong>{running}</strong><em>{data.sprints.length} planificados</em></div></article>
      <article><span className="stat-icon green"><CircleCheckBig /></span><div><small>Items completados</small><strong>{doneItems}</strong><em>en todos los proyectos</em></div></article>
      <article><span className="stat-icon amber"><Activity /></span><div><small>Estado del equipo</small><strong className="text-stat">En ritmo</strong><em>Todo bajo control</em></div></article>
    </section>
    <section><div className="section-heading"><div><h2>{query ? 'Resultados de búsqueda' : 'Proyectos recientes'}</h2><p>Seguimiento de portafolio y progreso general</p></div><span>{visibleProjects.length} proyectos</span></div><ProjectList projects={visibleProjects} /></section>
    <FormModal open={modal === 'client'} title="Nuevo cliente" description="Registra a la persona o empresa responsable del proyecto." onClose={() => setModal('')}>
      <form className="entity-form" onSubmit={submitClient}><div className="form-grid"><label>Nombre<input name="name" required placeholder="Ana Torres" /></label><label>Email<input name="email" type="email" required placeholder="ana@empresa.com" /></label><label className="full-field">Empresa <span>(opcional)</span><input name="companyName" placeholder="Nombre de la empresa" /></label></div>{action.error && <div className="form-error">{action.error}</div>}<footer><button type="button" className="ghost-button" onClick={() => setModal('')}>Cancelar</button><button className="primary-button" disabled={action.saving}>{action.saving ? 'Guardando…' : 'Crear cliente'}</button></footer></form>
    </FormModal>
    <FormModal open={modal === 'project'} title="Nuevo proyecto" description="Define los datos principales y el acceso del cliente." onClose={() => setModal('')}>
      <form className="entity-form" onSubmit={submitProject}><div className="form-grid"><label className="full-field">Nombre<input name="name" required placeholder="Rediseño de plataforma" /></label><label className="full-field">Descripción<textarea name="description" required rows="3" placeholder="Objetivo y alcance general del proyecto" /></label><label>Cliente<select name="clientId" required defaultValue=""><option value="" disabled>Selecciona un cliente</option>{data.clients.map((client) => <option key={client.id} value={client.id}>{client.companyName || client.name}</option>)}</select></label><label>Estado<select name="status" defaultValue="active"><option value="active">Activo</option><option value="paused">Pausado</option><option value="done">Finalizado</option></select></label><label>Fecha de inicio<input name="startDate" type="date" required /></label><label>Fecha de fin <span>(opcional)</span><input name="endDate" type="date" /></label><label className="full-field">Entregables <span>(uno por línea)</span><textarea name="deliverables" rows="3" placeholder={'MVP navegable\nDocumentación técnica'} /></label><label className="full-field">Bloqueos <span>(opcional)</span><textarea name="blockers" rows="2" placeholder="Sin bloqueos actuales" /></label></div>{!data.clients.length && <div className="form-notice">Primero crea un cliente para poder asociarlo.</div>}{action.error && <div className="form-error">{action.error}</div>}<footer><button type="button" className="ghost-button" onClick={() => setModal('')}>Cancelar</button><button className="primary-button" disabled={action.saving || !data.clients.length}>{action.saving ? 'Guardando…' : 'Crear proyecto'}</button></footer></form>
    </FormModal>
    <Toast message={toast.message} onClose={toast.dismiss} />
  </div>
}
