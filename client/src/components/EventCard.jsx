import { CalendarCheck, MapPin, MoreHorizontal, Presentation, Repeat2, Users, Video } from 'lucide-react'

const icons = { MEETING: Users, DEMO: Presentation, PLANNING: CalendarCheck, RETRO: Repeat2 }
const labels = { MEETING: 'Reunión', DEMO: 'Demo', PLANNING: 'Planning', RETRO: 'Retro' }
const time = (value) => new Intl.DateTimeFormat('es', { hour: '2-digit', minute: '2-digit' }).format(new Date(value))

export function EventCard({ event, onEdit }) {
  const Icon = icons[event.type] || Users
  return <button className={`event-card event-${event.type.toLowerCase()} ${event.status === 'CANCELLED' ? 'event-cancelled' : ''}`} onClick={() => onEdit(event)}>
    <span className="event-type-icon"><Icon size={16} /></span><div><span className="event-kind">{labels[event.type]}</span><strong>{event.title}</strong><small>{time(event.startDateTime)} – {time(event.endDateTime)} · {event.project.name}</small>{event.location && <em><MapPin size={12} />{event.location}</em>}{event.googleMeetUrl && <em className="meet-indicator"><Video size={12} />Google Meet</em>}</div><MoreHorizontal size={16} />
  </button>
}
