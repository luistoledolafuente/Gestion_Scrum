import { CalendarRange, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { StatusBadge } from './StatusBadge'

const formatDate = (date) => new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short' }).format(new Date(date))

export function SprintList({ sprints = [] }) {
  if (!sprints.length) return <div className="empty-inline">No hay sprints configurados en este proyecto.</div>
  return <div className="list-stack">{sprints.map((sprint) => (
    <Link to={`/sprints/${sprint.id}`} className="sprint-row" key={sprint.id}>
      <span className="list-icon"><CalendarRange size={19} /></span>
      <div><strong>{sprint.name}</strong><small>{formatDate(sprint.startDate)} — {formatDate(sprint.endDate)}</small></div>
      <StatusBadge status={sprint.status} /><ChevronRight size={18} />
    </Link>
  ))}</div>
}
