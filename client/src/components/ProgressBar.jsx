export function ProgressBar({ value, showLabel = true }) {
  const safeValue = Math.min(100, Math.max(0, value || 0))
  return (
    <div className="progress-wrap">
      <div className="progress-track" aria-label={`${safeValue}% completado`}>
        <span style={{ width: `${safeValue}%` }} />
      </div>
      {showLabel && <strong>{safeValue}%</strong>}
    </div>
  )
}
