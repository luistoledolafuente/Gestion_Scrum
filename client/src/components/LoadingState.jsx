export function LoadingState({ label = 'Cargando información…' }) {
  return <div className="skeleton-page" aria-label={label}><div className="skeleton-line skeleton-short" /><div className="skeleton-line skeleton-title" /><div className="skeleton-grid"><span /><span /><span /></div><div className="skeleton-panel" /></div>
}

export function ErrorState({ message, onRetry }) {
  return <div className="state-panel state-error"><strong>No pudimos cargar esta vista</strong><span>{message}</span>{onRetry && <button className="secondary-button" onClick={onRetry}>Intentar nuevamente</button>}</div>
}
