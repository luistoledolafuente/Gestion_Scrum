import { ArrowLeft, CheckCircle2, Gauge, Plus, Target } from 'lucide-react'
import { useCallback, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { BurndownChart } from '../components/BurndownChart'
import { FormModal } from '../components/FormModal'
import { KanbanBoard } from '../components/KanbanBoard'
import { ErrorState, LoadingState } from '../components/LoadingState'
import { StatusBadge } from '../components/StatusBadge'
import { SyncStatus } from '../components/SyncStatus'
import { Toast } from '../components/Toast'
import { usePolling } from '../hooks/usePolling'
import { useToast } from '../hooks/useToast'
import { getErrorMessage } from '../services/api'
import { projectsService } from '../services/projects.service'
import { sprintsService } from '../services/sprints.service'

export function SprintPage() {
  const { sprintId } = useParams()
  const [error, setError] = useState('')
  const [updatingId, setUpdatingId] = useState('')
  const [modal, setModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const toast = useToast()
  const fetchSprint = useCallback(async () => {
    const [sprintData, metricsData] = await Promise.all([sprintsService.getById(sprintId), sprintsService.getMetrics(sprintId)])
    const projectData = await projectsService.getById(sprintData.projectId)
    return { sprint: sprintData, metrics: metricsData, project: projectData }
  }, [sprintId])
  const polling = usePolling(fetchSprint, 15000)
  const { sprint, metrics, project } = polling.data || {}
  const moveItem = async (id, state) => {
    setUpdatingId(id)
    try { await sprintsService.updateItem(id, { state }); await polling.refresh(); toast.showToast('Estado actualizado en el tablero.') } catch (err) { setError(getErrorMessage(err)) } finally { setUpdatingId('') }
  }
  const addItem = async (event) => {
    event.preventDefault(); setSaving(true); setError('')
    const backlogItemId = new FormData(event.currentTarget).get('backlogItemId')
    try { await sprintsService.createItem({ sprintId, backlogItemId }); setModal(false); await polling.refresh(); toast.showToast('Item añadido al sprint.') }
    catch (err) { setError(getErrorMessage(err)) }
    finally { setSaving(false) }
  }
  if (polling.initialLoading) return <LoadingState label="Preparando el sprint…" />
  if (!sprint || !metrics) return <ErrorState message={polling.error} onRetry={polling.refresh} />
  const assigned = new Set(sprint.items.map((item) => item.backlogItemId))
  const availableItems = (project?.backlogItems || []).filter((item) => !assigned.has(item.id) && item.status !== 'done')
  return <div className="page wide-page">
    <Link className="back-link" to={`/projects/${sprint.projectId}`}><ArrowLeft size={17} />Volver a {sprint.project.name}</Link>
    <div className="page-heading sprint-heading"><div><div className="title-line"><h1>{sprint.name}</h1><StatusBadge status={sprint.status} /></div><p>{sprint.goal}</p></div><SyncStatus {...polling} onRefresh={polling.refresh} /></div>
    {error && <div className="inline-alert">{error}</div>}
    <section className="sprint-summary"><article><span><Gauge /></span><div><small>Avance</small><strong>{metrics.progressPercentage}%</strong></div></article><article><span><CheckCircle2 /></span><div><small>Completados</small><strong>{metrics.completedPoints} pts</strong></div></article><article><span><Target /></span><div><small>Comprometidos</small><strong>{metrics.totalPoints} pts</strong></div></article><div className="mini-chart"><div><strong>Burndown</strong><small>Puntos restantes vs. línea ideal</small></div><BurndownChart data={metrics.burndown} /></div></section>
    <div className="section-heading"><div><h2>Tablero del sprint</h2><p>Mueve cada tarjeta desde el selector de estado</p></div><button className="tiny-button" onClick={() => { setError(''); setModal(true) }}><Plus size={14} />Añadir item</button></div>
    <KanbanBoard items={sprint.items} onMove={moveItem} updatingId={updatingId} />
    <FormModal open={modal} title="Añadir al sprint" description="Selecciona un item existente del backlog de este proyecto." onClose={() => setModal(false)}><form className="entity-form" onSubmit={addItem}><div className="form-grid"><label className="full-field">Item de backlog<select name="backlogItemId" required defaultValue=""><option value="" disabled>Selecciona un item</option>{availableItems.map((item) => <option value={item.id} key={item.id}>{item.title} · {item.storyPoints} pts</option>)}</select></label></div>{!availableItems.length && <div className="form-notice">No quedan items disponibles. Crea uno nuevo desde la vista del proyecto.</div>}{error && <div className="form-error">{error}</div>}<footer><button type="button" className="ghost-button" onClick={() => setModal(false)}>Cancelar</button><button className="primary-button" disabled={saving || !availableItems.length}>{saving ? 'Añadiendo…' : 'Añadir al sprint'}</button></footer></form></FormModal>
    <Toast message={toast.message} onClose={toast.dismiss} />
  </div>
}
