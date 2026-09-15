import { ExternalLink, Video } from 'lucide-react'

const localDateTime = (value) => {
  if (!value) return ''
  const date = new Date(value)
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

export function CalendarEventForm({ event, projects, clients, saving, error, onSubmit, onCancel }) {
  return <form className="entity-form" onSubmit={onSubmit} key={event?.id || 'new-event'}><div className="form-grid">
    <label className="full-field">Título<input name="title" required defaultValue={event?.title} placeholder="Reunión de avance Sprint 03" /></label>
    <label className="full-field">Descripción<textarea name="description" required rows="3" defaultValue={event?.description} placeholder="Temas a revisar y objetivo" /></label>
    <label>Tipo<select name="type" defaultValue={event?.type || 'MEETING'}><option value="MEETING">Reunión</option><option value="DEMO">Demo</option><option value="PLANNING">Planning</option><option value="RETRO">Retrospectiva</option></select></label>
    <label>Estado<select name="status" defaultValue={event?.status || 'SCHEDULED'}><option value="SCHEDULED">Programada</option><option value="DONE">Realizada</option><option value="CANCELLED">Cancelada</option></select></label>
    <label className="full-field">Proyecto<select name="projectId" required defaultValue={event?.projectId || ''}><option value="" disabled>Selecciona un proyecto</option>{projects.map((project) => <option value={project.id} key={project.id}>{project.name}</option>)}</select></label>
    <label>Cliente <span>(opcional)</span><select name="clientId" defaultValue={event?.clientId || ''}><option value="">Sin cliente</option>{clients.map((client) => <option value={client.id} key={client.id}>{client.companyName || client.name}</option>)}</select></label>
    <label>Ubicación <span>(opcional)</span><input name="location" defaultValue={event?.location || ''} placeholder="Google Meet / Oficina" /></label>
    <label>Inicio<input name="startDateTime" type="datetime-local" required defaultValue={localDateTime(event?.startDateTime)} /></label>
    <label>Fin<input name="endDateTime" type="datetime-local" required defaultValue={localDateTime(event?.endDateTime)} /></label>
    <label className="checkbox-field full-field"><input name="syncWithGoogle" type="checkbox" defaultChecked={event ? event.syncWithGoogle : true} />Sincronizar con mi Google Calendar</label>
    <label className="checkbox-field full-field"><input name="createGoogleMeet" type="checkbox" defaultChecked={event?.createGoogleMeet || false} />Crear un enlace único de Google Meet</label>
    <label className="checkbox-field full-field"><input name="inviteClient" type="checkbox" defaultChecked={event?.inviteClient || false} />Invitar al correo del cliente seleccionado</label>
    {event?.googleMeetUrl && <a className="meet-link full-field" href={event.googleMeetUrl} target="_blank" rel="noreferrer"><Video size={16} />Abrir Google Meet <ExternalLink size={13} /></a>}
  </div>{error && <div className="form-error">{error}</div>}<footer><button type="button" className="ghost-button" onClick={onCancel}>Cancelar</button><button className="primary-button" disabled={saving || !projects.length}>{saving ? 'Guardando…' : event ? 'Guardar cambios' : 'Crear reunión'}</button></footer></form>
}
