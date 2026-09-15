import { AlertTriangle, CheckCircle2, PackageCheck } from 'lucide-react'
import { ProgressBar } from './ProgressBar'
import { StatusBadge } from './StatusBadge'

export function ClientStatusCard({ data }) {
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
      <section className="panel"><div className="panel-title"><PackageCheck size={20} /><div><h2>Entregables</h2><p>Resultados acordados</p></div></div>
        <ul className="deliverable-list">{data.deliverables.length ? data.deliverables.map((item) => <li key={item}><CheckCircle2 size={17} />{item}</li>) : <li className="muted">Sin entregables publicados.</li>}</ul>
      </section>
    </div>
    {data.blockers && <section className="blocker-card"><AlertTriangle size={20} /><div><strong>Bloqueos actuales</strong><p>{data.blockers}</p></div></section>}
  </>
}
