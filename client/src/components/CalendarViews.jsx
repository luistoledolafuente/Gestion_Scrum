import { CalendarDays, Clock3 } from 'lucide-react'
import { EventCard } from './EventCard'
import { addDays, dayKey } from '../utils/calendar'

const eventsFor = (events, day) => events.filter((event) => dayKey(new Date(event.startDateTime)) === dayKey(day))
const isToday = (day) => dayKey(day) === dayKey(new Date())
const weekDay = (day) => new Intl.DateTimeFormat('es', { weekday: 'short' }).format(day)
const time = (value) => new Intl.DateTimeFormat('es', { hour: '2-digit', minute: '2-digit' }).format(new Date(value))

export function WeekCalendar({ start, events, onEdit }) {
  const days = Array.from({ length: 7 }, (_, index) => addDays(start, index))
  return <section className="week-grid">{days.map((day) => {
    const items = eventsFor(events, day)
    return <div className={`day-column ${isToday(day) ? 'today-column' : ''}`} key={dayKey(day)}><header><span>{weekDay(day)}</span><strong>{day.getDate()}</strong></header><div>{items.map((event) => <EventCard event={event} onEdit={onEdit} key={event.id} />)}{!items.length && <span className="day-empty">Sin eventos</span>}</div></div>
  })}</section>
}

export function MonthCalendar({ start, month, events, onEdit }) {
  const days = Array.from({ length: 42 }, (_, index) => addDays(start, index))
  return <section className="month-calendar">
    <div className="month-weekdays">{Array.from({ length: 7 }, (_, index) => <span key={index}>{weekDay(addDays(start, index))}</span>)}</div>
    <div className="month-grid">{days.map((day) => {
      const items = eventsFor(events, day)
      return <div className={`month-cell ${day.getMonth() !== month ? 'outside-month' : ''} ${isToday(day) ? 'today-cell' : ''}`} key={dayKey(day)}>
        <header><span>{day.getDate()}</span>{items.length > 0 && <b>{items.length}</b>}</header>
        <div>{items.slice(0, 3).map((event) => <button className={`month-event month-event-${event.type.toLowerCase()}`} onClick={() => onEdit(event)} key={event.id}><time>{time(event.startDateTime)}</time><span>{event.title}</span></button>)}{items.length > 3 && <small>+{items.length - 3} más</small>}</div>
      </div>
    })}</div>
  </section>
}

export function DayCalendar({ day, events, onEdit }) {
  const items = eventsFor(events, day).sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime))
  if (!items.length) return <section className="day-agenda day-agenda-empty"><CalendarDays size={28} /><h2>No hay eventos este día</h2><p>Crea una reunión para empezar a organizar la jornada.</p></section>
  return <section className="day-agenda"><header><Clock3 size={18} /><div><strong>{items.length} {items.length === 1 ? 'evento' : 'eventos'}</strong><span>Agenda del día</span></div></header><div className="day-agenda-list">{items.map((event) => <div className="day-agenda-row" key={event.id}><time><strong>{time(event.startDateTime)}</strong><span>{time(event.endDateTime)}</span></time><EventCard event={event} onEdit={onEdit} /></div>)}</div></section>
}
