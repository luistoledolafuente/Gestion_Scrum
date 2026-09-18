import { ArrowLeft, CalendarDays, Clock3, Copy, ExternalLink, ListChecks, Plus, Target } from 'lucide-react'
import { useCallback, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FormModal } from '../components/FormModal'
import { DeliverablesPanel } from '../components/DeliverablesPanel'
import { ErrorState, LoadingState } from '../components/LoadingState'
import { ProgressBar } from '../components/ProgressBar'
import { SprintList } from '../components/SprintList'
import { StatusBadge } from '../components/StatusBadge'
import { SyncStatus } from '../components/SyncStatus'
import { Toast } from '../components/Toast'
import { usePolling } from '../hooks/usePolling'
import { useToast } from '../hooks/useToast'
import { useAuth } from '../hooks/useAuth'
import { getErrorMessage } from '../services/api'
import { projectsService } from '../services/projects.service'
import { sprintsService } from '../services/sprints.service'

const formatDate = (date) => date ? new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(date)) : 'Sin fecha'

export function ProjectPage() {
  const { canEdit } = useAuth()
  const { projectId } = useParams()
  const [modal, setModal] = useState('')
  const [action, setAction] = useState({ saving: false, error: '' })
  const toast = useToast()
  const fetchProject = useCallback(() => projectsService.getById(projectId), [projectId])
  const polling = usePolling(fetchProject, 20000)
  const project = polling.data
  const openModal = (name) => { setAction({ saving: false, error: '' }); setModal(name) }
  const copyPortalLink = async () => {
    const url = `${window.location.origin}/portal/${project.publicPortalToken}`
    try { await navigator.clipboard.writeText(url); toast.showToast('Enlace del portal copiado. Ya puedes compartirlo con tu cliente.') }
    catch { toast.showToast('No se pudo copiar el enlace. Abre el portal y copia la dirección del navegador.') }
  }
  const submitSprint = async (event) => {
    event.preventDefault(); setAction({ saving: true, error: '' })
    const payload = { ...Object.fromEntries(new FormData(event.currentTarget)), projectId }
    try { await sprintsService.create(payload); setModal(''); await polling.refresh(); toast.showToast('Sprint creado. La vista ya está actualizada.') }
    catch (err) { setAction({ saving: false, error: getErrorMessage(err) }); return }
    setAction({ saving: false, error: '' })
  }
  const submitBacklog = async (event) => {
    event.preventDefault(); setAction({ saving: true, error: '' })
    const payload = { ...Object.fromEntries(new FormData(event.currentTarget)), projectId }
    payload.storyPoints = Number(payload.storyPoints || 0)
    payload.isKey = payload.isKey === 'on'
    try { await projectsService.createBacklogItem(payload); setModal(''); await polling.refresh(); toast.showToast('Item añadido al backlog.') }
    catch (err) { setAction({ saving: false, error: getErrorMessage(err) }); return }
    setAction({ saving: false, error: '' })
  }
  if (polling.initialLoading) return <LoadingState label="Cargando proyecto…" />
  if (!project) return <ErrorState message={polling.error} onRetry={polling.refresh} />
  const total = project.backlogItems.reduce((sum, item) => sum + item.storyPoints, 0)
  const completed = project.backlogItems.filter((item) => item.status === 'done').reduce((sum, item) => sum + item.storyPoints, 0)
  const progress = total ? Math.round((completed / total) * 100) : 0
  const upcoming = (project.calendarEvents || []).filter((event) => event.status === 'SCHEDULED' && new Date(event.endDateTime) >= new Date()).slice(0, 4)
  return <div className="page">
    <Link className="back-link" to="/"><ArrowLeft size={17} />Volver al resumen</Link>
    <div className="project-heading"><div><div className="title-line"><h1>{project.name}</h1><StatusBadge status={project.status} /></div><p>{project.description}</p><div className="project-meta"><span><CalendarDays size={16} />{formatDate(project.startDate)} — {formatDate(project.endDate)}</span><span>Cliente: <b>{project.client.companyName || project.client.name}</b></span></div></div><div className="heading-actions"><SyncStatus {...polling} onRefresh={polling.refresh} compact />{canEdit && <><button className="secondary-button" onClick={() => openModal('backlog')}><Plus size={16} />Backlog</button><button className="primary-button" onClick={() => openModal('sprint')}><Plus size={16} />Sprint</button></>}<button className="secondary-button" onClick={copyPortalLink}>Copiar enlace <Copy size={16} /></button><Link className="secondary-button" to={`/portal/${project.publicPortalToken}`} target="_blank">Ver portal <ExternalLink size={16} /></Link></div></div>
    <section className="project-kpis"><article><span><Target /></span><div><small>Avance general</small><strong>{progress}%</strong><ProgressBar value={progress} showLabel={false} /></div></article><article><span><ListChecks /></span><div><small>Puntos completados</small><strong>{completed} <em>/ {total}</em></strong><p>story points</p></div></article><article><span><CalendarDays /></span><div><small>Sprints</small><strong>{project.sprints.length}</strong><p>{project.sprints.filter((item) => item.status === 'in_progress').length} en progreso</p></div></article></section>
    <section className="panel meetings-panel"><div className="section-heading compact"><div><h2>Próximas reuniones</h2><p>Agenda relacionada con este proyecto</p></div><Link className="tiny-button" to="/calendar">Ver calendario</Link></div><div className="meeting-strip">{upcoming.map((event) => <Link to="/calendar" key={event.id}><span className={`meeting-type meeting-${event.type.toLowerCase()}`}><CalendarDays size={16} /></span><div><strong>{event.title}</strong><small><Clock3 size={12} />{new Intl.DateTimeFormat('es', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(event.startDateTime))}</small></div></Link>)}{!upcoming.length && <div className="empty-inline">No hay reuniones próximas para este proyecto.</div>}</div></section>
    <div className="two-column"><section className="panel"><div className="section-heading compact"><div><h2>Sprints</h2><p>Iteraciones del proyecto</p></div>{canEdit && <button className="tiny-button" onClick={() => openModal('sprint')}><Plus size={14} />Añadir</button>}</div><SprintList sprints={project.sprints} /></section><section className="panel"><div className="section-heading compact"><div><h2>Backlog</h2><p>Items priorizados</p></div>{canEdit && <button className="tiny-button" onClick={() => openModal('backlog')}><Plus size={14} />Añadir</button>}</div><div className="backlog-list">{project.backlogItems.map((item) => <div key={item.id}><span className={`type-dot type-${item.type}`} /><div><strong>{item.title}</strong><small>{item.type} · {item.storyPoints} pts</small></div><StatusBadge status={item.status} /></div>)}{!project.backlogItems.length && <div className="empty-inline">El backlog todavía está vacío.</div>}</div></section></div>
    <DeliverablesPanel projectId={project.id} deliverables={project.deliverables} canEdit={canEdit} onRefresh={polling.refresh} onNotify={toast.showToast} />
    <FormModal open={modal === 'sprint'} title="Nuevo sprint" description="Crea una iteración para organizar el siguiente bloque de trabajo." onClose={() => setModal('')}><form className="entity-form" onSubmit={submitSprint}><div className="form-grid"><label className="full-field">Nombre<input name="name" required placeholder="Sprint 1" /></label><label className="full-field">Objetivo<textarea name="goal" required rows="3" placeholder="Resultado que queremos alcanzar" /></label><label>Inicio<input name="startDate" type="date" required /></label><label>Fin<input name="endDate" type="date" required /></label><label className="full-field">Estado<select name="status" defaultValue="planned"><option value="planned">Planificado</option><option value="in_progress">En progreso</option><option value="completed">Completado</option></select></label></div>{action.error && <div className="form-error">{action.error}</div>}<footer><button type="button" className="ghost-button" onClick={() => setModal('')}>Cancelar</button><button className="primary-button" disabled={action.saving}>{action.saving ? 'Guardando…' : 'Crear sprint'}</button></footer></form></FormModal>
    <FormModal open={modal === 'backlog'} title="Nuevo item de backlog" description="Añade una historia, tarea o incidencia al proyecto." onClose={() => setModal('')}><form className="entity-form" onSubmit={submitBacklog}><div className="form-grid"><label className="full-field">Título<input name="title" required placeholder="Implementar acceso de usuarios" /></label><label className="full-field">Descripción<textarea name="description" required rows="3" placeholder="Criterio y alcance del item" /></label><label>Tipo<select name="type" defaultValue="story"><option value="story">Historia</option><option value="task">Tarea</option><option value="bug">Bug</option></select></label><label>Prioridad<select name="priority" defaultValue="medium"><option value="low">Baja</option><option value="medium">Media</option><option value="high">Alta</option></select></label><label>Puntos<input name="storyPoints" type="number" min="0" defaultValue="1" required /></label><label>Estado<select name="status" defaultValue="backlog"><option value="backlog">Backlog</option><option value="in_sprint">En sprint</option><option value="done">Finalizado</option></select></label><label className="checkbox-field full-field"><input name="isKey" type="checkbox" />Mostrar como hito clave en el portal del cliente</label></div>{action.error && <div className="form-error">{action.error}</div>}<footer><button type="button" className="ghost-button" onClick={() => setModal('')}>Cancelar</button><button className="primary-button" disabled={action.saving}>{action.saving ? 'Guardando…' : 'Crear item'}</button></footer></form></FormModal>
    <Toast message={toast.message} onClose={toast.dismiss} />
  </div>
}
