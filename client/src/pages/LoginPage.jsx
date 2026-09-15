import { ArrowRight, LockKeyhole, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getErrorMessage } from '../services/api'
import { authService } from '../services/auth.service'

export function LoginPage() {
  const { user, login } = useAuth()
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  if (user) return <Navigate to={location.state?.from || '/'} replace />
  const submit = async (event) => {
    event.preventDefault(); setSaving(true); setError('')
    try { await login(Object.fromEntries(new FormData(event.currentTarget))); navigate(location.state?.from || '/', { replace: true }) }
    catch (err) { setError(getErrorMessage(err)) }
    finally { setSaving(false) }
  }
  return <div className="auth-shell"><section className="auth-visual"><div className="auth-brand"><span className="brand-mark"><Sparkles size={18} /></span>Momentum</div><div><span className="eyebrow">Scrum, clientes y entregas</span><h1>Tu equipo alineado.<br />Tus clientes informados.</h1><p>Gestiona proyectos, reuniones, sprints y reportes desde un workspace seguro.</p></div><small>Una experiencia clara para equipos que quieren avanzar.</small></section><main className="auth-panel"><div className="auth-card"><span className="auth-icon"><LockKeyhole size={21} /></span><h2>Bienvenido de nuevo</h2><p>Ingresa para continuar a tu workspace.</p><a className="google-auth-button" href={authService.googleLoginUrl}><span>G</span>Continuar con Google</a><div className="auth-divider"><span>o continúa con tu correo</span></div><form onSubmit={submit}><label>Correo electrónico<input name="email" type="email" autoComplete="email" required placeholder="tu@empresa.com" /></label><label>Contraseña<input name="password" type="password" autoComplete="current-password" required placeholder="••••••••" /></label>{error && <div className="form-error">{error}</div>}<button className="primary-button auth-submit" disabled={saving}>{saving ? 'Ingresando…' : <>Iniciar sesión <ArrowRight size={16} /></>}</button></form><footer>¿Aún no tienes cuenta? <Link to="/register">Crear cuenta</Link></footer></div></main></div>
}
