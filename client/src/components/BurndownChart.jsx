import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export function BurndownChart({ data = [] }) {
  if (!data.length) return <div className="empty-inline">El gráfico aparecerá cuando el sprint tenga fechas.</div>
  return <div className="chart-box"><ResponsiveContainer width="100%" height="100%">
    <LineChart data={data} margin={{ top: 12, right: 12, left: -18, bottom: 0 }}>
      <XAxis dataKey="date" tickFormatter={(value) => value.slice(5).replace('-', '/')} axisLine={false} tickLine={false} tick={{ fill: '#8a91a3', fontSize: 12 }} />
      <YAxis axisLine={false} tickLine={false} allowDecimals={false} tick={{ fill: '#8a91a3', fontSize: 12 }} />
      <Tooltip contentStyle={{ border: '1px solid #e6e8ef', borderRadius: 12, boxShadow: '0 8px 24px rgba(20, 28, 50, .08)' }} />
      <Line type="monotone" dataKey="idealPoints" name="Ideal" stroke="#c5c9d4" strokeDasharray="5 5" dot={false} strokeWidth={2} />
      <Line type="monotone" dataKey="remainingPoints" name="Restante" stroke="#6558e8" dot={{ r: 3, fill: '#6558e8' }} strokeWidth={3} connectNulls={false} />
    </LineChart>
  </ResponsiveContainer></div>
}
