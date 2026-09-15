import { Activity, CalendarClock, Download, FolderKanban, Gauge, TriangleAlert } from 'lucide-react'
import { useCallback } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ErrorState, LoadingState } from '../components/LoadingState'
import { ProgressBar } from '../components/ProgressBar'
import { StatusBadge } from '../components/StatusBadge'
import { SyncStatus } from '../components/SyncStatus'
import { usePolling } from '../hooks/usePolling'
import { reportsService } from '../services/reports.service'

const statusLabels = { active: 'Activos', paused: 'Pausados', done: 'Finalizados', backlog: 'Backlog', in_sprint: 'En sprint' }
const colors = ['#6558e8', '#e6a34b', '#35a779']
const formatDate = (value) => value ? new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value)) : 'Sin fecha'

const downloadCsv = (projects) => {
  const escape = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`
  const rows = [['Proyecto', 'Cliente', 'Estado', 'Avance', 'Puntos completados', 'Puntos totales', 'Fecha fin', 'Bloqueos'], ...projects.map((project) => [project.name, project.client, project.status, `${project.progress}%`, project.completedPoints, project.totalPoints, formatDate(project.endDate), project.blockers || ''])]
  const blob = new Blob([rows.map((row) => row.map(escape).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a'); link.href = url; link.download = `reporte-portafolio-${new Date().toISOString().slice(0, 10)}.csv`; link.click(); URL.revokeObjectURL(url)
}

export function ReportsPage() {
  const fetchReport = useCallback(() => reportsService.getPortfolio(), [])
  const polling = usePolling(fetchReport, 30000)
  if (polling.initialLoading) return <LoadingState label="Generando reportes…" />
  if (!polling.data) return <ErrorState message={polling.error} onRetry={polling.refresh} />
  const { overview, projectStatus, velocity, projectProgress, risks } = polling.data
  const statusData = projectStatus.map((item) => ({ ...item, name: statusLabels[item.name] || item.name })).filter((item) => item.value > 0)
  return <div className="page wide-page reports-page">
    <div className="page-heading"><div><span className="eyebrow">Analítica del portafolio</span><h1>Reportes</h1><p>Avance, velocidad y riesgos de todos tus proyectos en un solo lugar.</p></div><div className="heading-actions"><SyncStatus {...polling} onRefresh={polling.refresh} compact /><button className="secondary-button" onClick={() => downloadCsv(projectProgress)}><Download size={16} />Exportar CSV</button></div></div>
    <section className="stat-grid report-stats">
      <article><span className="stat-icon purple"><Gauge /></span><div><small>Avance global</small><strong>{overview.overallProgress}%</strong><em>{overview.completedPoints} de {overview.totalPoints} puntos</em></div></article>
      <article><span className="stat-icon blue"><FolderKanban /></span><div><small>Proyectos activos</small><strong>{overview.activeProjects}</strong><em>de {overview.totalProjects} registrados</em></div></article>
      <article><span className="stat-icon green"><Activity /></span><div><small>Sprints en curso</small><strong>{overview.runningSprints}</strong><em>trabajo en ejecución</em></div></article>
      <article><span className="stat-icon amber"><CalendarClock /></span><div><small>Próximas reuniones</small><strong>{overview.upcomingMeetings}</strong><em>en el calendario</em></div></article>
    </section>
    <div className="report-grid">
      <section className="panel report-chart"><div className="section-heading compact"><div><h2>Estado del portafolio</h2><p>Distribución de proyectos</p></div></div>{statusData.length ? <div className="report-chart-box"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={statusData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={82} paddingAngle={3}>{statusData.map((entry, index) => <Cell key={entry.name} fill={colors[index % colors.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer><div className="chart-legend">{statusData.map((entry, index) => <span key={entry.name}><i style={{ background: colors[index % colors.length] }} />{entry.name}<b>{entry.value}</b></span>)}</div></div> : <div className="empty-inline">Aún no hay proyectos para graficar.</div>}</section>
      <section className="panel report-chart"><div className="section-heading compact"><div><h2>Velocidad reciente</h2><p>Puntos terminados por sprint completado</p></div></div>{velocity.length ? <div className="report-chart-box"><ResponsiveContainer width="100%" height="100%"><BarChart data={velocity} margin={{ left: -24, right: 8 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eceef3" /><XAxis dataKey="sprint" tick={{ fontSize: 10, fill: '#81889a' }} axisLine={false} tickLine={false} /><YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#81889a' }} axisLine={false} tickLine={false} /><Tooltip /><Bar dataKey="points" name="Puntos" fill="#6558e8" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div> : <div className="empty-inline">Completa un sprint para empezar a medir velocidad.</div>}</section>
    </div>
    <section className="panel report-table-panel"><div className="section-heading compact"><div><h2>Avance por proyecto</h2><p>Detalle actualizado del portafolio</p></div><span className={`risk-pill ${risks.blockedProjects || risks.highPriorityOpenItems ? 'has-risk' : ''}`}><TriangleAlert size={13} />{risks.blockedProjects} bloqueados · {risks.highPriorityOpenItems} items críticos</span></div><div className="report-table-wrap"><table className="report-table"><thead><tr><th>Proyecto</th><th>Cliente</th><th>Estado</th><th>Avance</th><th>Puntos</th><th>Fecha fin</th></tr></thead><tbody>{projectProgress.map((project) => <tr key={project.id}><td><strong>{project.name}</strong>{project.blockers && <small>{project.blockers}</small>}</td><td>{project.client}</td><td><StatusBadge status={project.status} /></td><td><div className="table-progress"><ProgressBar value={project.progress} showLabel={false} /><b>{project.progress}%</b></div></td><td>{project.completedPoints} / {project.totalPoints}</td><td>{formatDate(project.endDate)}</td></tr>)}</tbody></table>{!projectProgress.length && <div className="empty-inline">No hay proyectos registrados.</div>}</div></section>
  </div>
}
