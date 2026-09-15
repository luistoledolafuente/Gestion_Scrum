import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarEventForm } from '../components/CalendarEventForm'
import { DayCalendar, MonthCalendar, WeekCalendar } from '../components/CalendarViews'
import { FormModal } from '../components/FormModal'
import { LoadingState, ErrorState } from '../components/LoadingState'
import { SyncStatus } from '../components/SyncStatus'
import { Toast } from '../components/Toast'
import { usePolling } from '../hooks/usePolling'
import { useToast } from '../hooks/useToast'
import { getErrorMessage } from '../services/api'
import { calendarEventsService } from '../services/calendarEvents.service'
import { clientsService } from '../services/clients.service'
import { projectsService } from '../services/projects.service'
import { addDays, mondayOf, startOfDay } from '../utils/calendar'
import { useAuth } from '../hooks/useAuth'

const validViews = new Set(['day', 'week', 'month'])
const initialView = () => { const saved = localStorage.getItem('calendar-view'); return validViews.has(saved) ? saved : 'week' }
const monthGridStart = (date) => mondayOf(new Date(date.getFullYear(), date.getMonth(), 1))

export function CalendarPage() {
  const { canEdit } = useAuth()
  const [view, setView] = useState(initialView)
  const [anchorDate, setAnchorDate] = useState(() => new Date())
  const [metadata, setMetadata] = useState({ projects: [], clients: [] })
  const [metadataError, setMetadataError] = useState('')
  const [selected, setSelected] = useState(undefined)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const toast = useToast()

  const range = useMemo(() => {
    if (view === 'day') { const start = startOfDay(anchorDate); return { start, end: addDays(start, 1) } }
    if (view === 'month') { const start = monthGridStart(anchorDate); return { start, end: addDays(start, 42) } }
    const start = mondayOf(anchorDate); return { start, end: addDays(start, 7) }
  }, [anchorDate, view])
  const fetchEvents = useCallback(() => calendarEventsService.getAll({ start: range.start.toISOString(), end: range.end.toISOString() }), [range])
  const polling = usePolling(fetchEvents, 30000)

  useEffect(() => { Promise.all([projectsService.getAll(), clientsService.getAll()]).then(([projects, clients]) => setMetadata({ projects, clients })).catch(() => setMetadataError('No se pudieron cargar los proyectos y clientes para el formulario.')) }, [])
  useEffect(() => { localStorage.setItem('calendar-view', view) }, [view])

  const openCreate = () => { setFormError(''); setSelected(null) }
  const openEdit = (event) => { setFormError(''); setSelected(event) }
  const changePeriod = (direction) => setAnchorDate((current) => {
    if (view === 'day') return addDays(current, direction)
    if (view === 'week') return addDays(current, direction * 7)
    return new Date(current.getFullYear(), current.getMonth() + direction, 1)
  })
  const changeView = (nextView) => { setView(nextView); setAnchorDate(new Date(anchorDate)) }

  const submit = async (event) => {
    event.preventDefault(); setSaving(true); setFormError('')
    const values = Object.fromEntries(new FormData(event.currentTarget))
    const payload = {
      ...values,
      startDateTime: new Date(values.startDateTime).toISOString(),
      endDateTime: new Date(values.endDateTime).toISOString(),
      syncWithGoogle: values.syncWithGoogle === 'on',
      createGoogleMeet: values.createGoogleMeet === 'on',
      inviteClient: values.inviteClient === 'on',
    }
    if (!payload.clientId) {
      if (selected?.id) payload.clientId = null
      else delete payload.clientId
    }
    try {
      const result = selected?.id ? await calendarEventsService.update(selected.id, payload) : await calendarEventsService.create(payload)
      setSelected(undefined); await polling.refresh()
      const success = result.googleMeetUrl ? 'Reunión guardada con enlace de Google Meet.' : selected?.id ? 'Reunión actualizada y calendario refrescado.' : 'Reunión creada y calendario refrescado.'
      toast.showToast(result.syncWarning || success)
    } catch (error) { setFormError(getErrorMessage(error)) }
    finally { setSaving(false) }
  }
  const cancelMeeting = async () => {
    if (!selected?.id || !window.confirm('¿Cancelar esta reunión? También se eliminará de Google Calendar si está sincronizada.')) return
    setSaving(true)
    try { const result = await calendarEventsService.remove(selected.id); setSelected(undefined); await polling.refresh(); toast.showToast(result.syncWarning || 'Reunión cancelada.') }
    catch (error) { setFormError(getErrorMessage(error)) }
    finally { setSaving(false) }
  }

  const title = view === 'day'
    ? new Intl.DateTimeFormat('es', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(anchorDate)
    : view === 'month'
      ? new Intl.DateTimeFormat('es', { month: 'long', year: 'numeric' }).format(anchorDate)
      : `${new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short' }).format(range.start)} – ${new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short', year: 'numeric' }).format(addDays(range.end, -1))}`

  if (polling.initialLoading) return <LoadingState label="Cargando calendario…" />
  if (!polling.data && polling.error) return <ErrorState message={polling.error} onRetry={polling.refresh} />
  const events = polling.data || []
  return <div className="page wide-page">
    <div className="page-heading calendar-heading"><div><span className="eyebrow">Agenda compartida</span><h1>Calendario</h1><p>Reuniones, demos y ceremonias del equipo.</p></div><div className="heading-actions"><SyncStatus {...polling} onRefresh={polling.refresh} compact />{canEdit && <button className="primary-button" onClick={openCreate}><Plus size={17} />Nueva reunión</button>}</div></div>
    {metadataError && <div className="inline-alert">{metadataError}</div>}
    <div className="calendar-toolbar"><div className="calendar-navigation"><button onClick={() => changePeriod(-1)} aria-label="Periodo anterior"><ChevronLeft /></button><button className="today-button" onClick={() => setAnchorDate(new Date())}>Hoy</button><button onClick={() => changePeriod(1)} aria-label="Periodo siguiente"><ChevronRight /></button></div><strong>{title}</strong><div className="view-switcher" aria-label="Vista del calendario">{[['day', 'Día'], ['week', 'Semana'], ['month', 'Mes']].map(([key, label]) => <button className={view === key ? 'active' : ''} onClick={() => changeView(key)} key={key}>{label}</button>)}</div></div>
    {view === 'day' && <DayCalendar day={anchorDate} events={events} onEdit={canEdit ? openEdit : () => {}} />}
    {view === 'week' && <WeekCalendar start={range.start} events={events} onEdit={canEdit ? openEdit : () => {}} />}
    {view === 'month' && <MonthCalendar start={range.start} month={anchorDate.getMonth()} events={events} onEdit={canEdit ? openEdit : () => {}} />}
    <FormModal open={selected !== undefined} title={selected?.id ? 'Editar reunión' : 'Nueva reunión'} description="Sincroniza con Calendar y crea un Meet cuando lo necesites." onClose={() => setSelected(undefined)}><CalendarEventForm event={selected} projects={metadata.projects} clients={metadata.clients} saving={saving} error={formError} onSubmit={submit} onCancel={() => setSelected(undefined)} />{selected?.id && <div className="danger-zone"><button onClick={cancelMeeting} disabled={saving}>Cancelar reunión</button></div>}</FormModal>
    <Toast message={toast.message} onClose={toast.dismiss} />
  </div>
}
