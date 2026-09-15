import { ArrowUpRight, CalendarDays, FolderKanban } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ProgressBar } from './ProgressBar'
import { StatusBadge } from './StatusBadge'

const projectProgress = (items = []) => {
  const total = items.reduce((sum, item) => sum + item.storyPoints, 0)
  const done = items.filter((item) => item.status === 'done').reduce((sum, item) => sum + item.storyPoints, 0)
  return total ? Math.round((done / total) * 100) : 0
}

export function ProjectList({ projects }) {
  if (!projects.length) return <div className="empty-state"><span><FolderKanban /></span><h3>Aún no hay proyectos</h3><p>Crea el primer cliente y proyecto desde la API para empezar a seguir su avance.</p></div>
  return <div className="project-grid">{projects.map((project) => (
    <Link className="project-card" to={`/projects/${project.id}`} key={project.id}>
      <div className="card-top"><div className="project-icon">{project.name.slice(0, 2).toUpperCase()}</div><StatusBadge status={project.status} /></div>
      <div><h3>{project.name}</h3><p>{project.description}</p></div>
      <ProgressBar value={projectProgress(project.backlogItems)} />
      <div className="card-footer"><span><CalendarDays size={16} />{project.sprints?.length || 0} sprints</span><span>{project.client?.companyName || project.client?.name}<ArrowUpRight size={16} /></span></div>
    </Link>
  ))}</div>
}
