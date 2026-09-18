import { AlertTriangle, CheckCircle2, Circle, PackageCheck } from 'lucide-react'
import { ProgressBar } from './ProgressBar'
import { StatusBadge } from './StatusBadge'

export function ClientStatusCard({ data }) {
  const deliverables = (data.deliverables || []).map((item, index) => typeof item === 'string' ? { id: index, title: item, completed: false } : item)
  const completedDeliverables = deliverables.filter((item) => item.completed).length
  return <>
    <section className="portal-hero">
      <div><span className="eyebrow">Resumen del proyecto</span><h1>{data.project.name}</h1><p>{data.project.description}</p></div>
      <StatusBadge status={data.project.status} />
      <div className="portal-progress"><span>Avance general</span><strong>{data.progressPercentage}%</strong><ProgressBar value={data.progressPercentage} showLabel={false} /></div>
    </section>
    <div className="portal-grid">
      <section className="panel"><div className="panel-title"><CheckCircle2 size={20} /><div><h2>Hitos principales</h2><p>Entregas clave y su estado actual</p></div></div>
        <div className="milestone-list">{data.milestones.length ? data.milestones.map((item) => <div key={item.id}><span className={item.status === 'done' ? 'milestone-done' : ''}><CheckCircle2 size={18} /></span><div><strong>{item.title}</strong><small>{item.description}</small></div><em>{item.status === 'done' ? 'Listo' : 'En curso'}</em></div>) : <div className="empty-inline">Aún no hay hitos publicados.</div>}</div>
      </section>
      <section className="panel"><div className="panel-title"><PackageCheck size={20} /><div><h2>Entregables</h2><p>{deliverables.length ? `${completedDeliverables} de ${deliverables.length} completados` : 'Resultados acordados'}</p></div></div>
        {deliverables.length > 0 && <div className="deliverables-progress portal-deliverables-progress"><span style={{ width: `${(completedDeliverables / deliverables.length) * 100}%` }} /></div>}
        <ul className="deliverable-list">{deliverables.length ? deliverables.map((item) => <li className={item.completed ? 'is-complete' : ''} key={item.id}><span>{item.completed ? <CheckCircle2 size={17} /> : <Circle size={17} />}</span><div><strong>{item.title}</strong><small>{item.completed ? 'Entregado' : 'Pendiente'}</small></div></li>) : <li className="muted">Sin entregables publicados.</li>}</ul>
      </section>
    </div>
    {data.blockers && <section className="blocker-card"><AlertTriangle size={20} /><div><strong>Bloqueos actuales</strong><p>{data.blockers}</p></div></section>}
  </>
}
