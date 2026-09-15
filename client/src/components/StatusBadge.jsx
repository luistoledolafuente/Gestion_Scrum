const labels = {
  active: 'Activo', paused: 'Pausado', done: 'Finalizado', planned: 'Planificado',
  in_progress: 'En progreso', completed: 'Completado', backlog: 'Backlog',
  in_sprint: 'En sprint', todo: 'Por hacer', review: 'En revisión',
}

export function StatusBadge({ status }) {
  return <span className={`status-badge status-${status}`}>{labels[status] || status}</span>
}
