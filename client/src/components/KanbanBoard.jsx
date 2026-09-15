import { Bug, CheckSquare2, CircleDot, Sparkles } from 'lucide-react'

const columns = [
  { id: 'todo', label: 'Por hacer', color: '#8b93a7' },
  { id: 'in_progress', label: 'En progreso', color: '#3f7ee8' },
  { id: 'review', label: 'En revisión', color: '#e49a36' },
  { id: 'done', label: 'Completado', color: '#2aa876' },
]
const typeIcon = { bug: Bug, task: CheckSquare2, story: Sparkles }

export function KanbanBoard({ items = [], onMove, updatingId }) {
  return <div className="kanban-board">{columns.map((column) => {
    const columnItems = items.filter((item) => item.state === column.id)
    return <section className="kanban-column" key={column.id}>
      <header><span className="column-dot" style={{ background: column.color }} />{column.label}<b>{columnItems.length}</b></header>
      <div className="kanban-stack">
        {columnItems.map((item) => {
          const Icon = typeIcon[item.backlogItem.type] || CircleDot
          return <article className={`kanban-card ${updatingId === item.id ? 'is-updating' : ''}`} key={item.id}>
            <span className={`priority priority-${item.backlogItem.priority}`}>{item.backlogItem.priority}</span>
            <h4>{item.backlogItem.title}</h4>
            <p>{item.backlogItem.description}</p>
            <footer><span><Icon size={15} />{item.backlogItem.type}</span><b>{item.backlogItem.storyPoints} pts</b></footer>
            <select aria-label={`Mover ${item.backlogItem.title}`} value={item.state} disabled={updatingId === item.id} onChange={(event) => onMove(item.id, event.target.value)}>
              {columns.map((option) => <option value={option.id} key={option.id}>{option.label}</option>)}
            </select>
          </article>
        })}
        {!columnItems.length && <div className="kanban-empty">Sin tareas</div>}
      </div>
    </section>
  })}</div>
}
