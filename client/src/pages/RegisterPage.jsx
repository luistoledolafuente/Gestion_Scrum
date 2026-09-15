import { ArrowRight, Sparkles, UserPlus } from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getErrorMessage } from '../services/api'
import { authService } from '../services/auth.service'

export function RegisterPage() {
  const { user, register } = useAuth()
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()
  if (user) return <Navigate to="/" replace />
  const submit = async (event) => {
    event.preventDefault(); setSaving(true); setError('')
    const values = Object.fromEntries(new FormData(event.currentTarget))
    if (values.password !== values.confirmPassword) { setError('Las contraseñas no coinciden.'); setSaving(false); return }
    try { await register({ name: values.name, email: values.email, password: values.password }); navigate('/', { replace: true }) }
    catch (err) { setError(getErrorMessage(err)) }
    finally { setSaving(false) }
  }
  return <div className="auth-shell"><section className="auth-visual"><div className="auth-brand"><span className="brand-mark"><Sparkles size={18} /></span>Momentum</div><div><span className="eyebrow">Empieza en minutos</span><h1>Crea tu workspace<br />y organiza el trabajo.</h1><p>Tu cuenta incluye un espacio propio para proyectos, equipo, reuniones y clientes.</p></div><small>Google Calendar se conecta después y es completamente opcional.</small></section><main className="auth-panel"><div className="auth-card"><span className="auth-icon"><UserPlus size={21} /></span><h2>Crear una cuenta</h2><p>Configura tu acceso principal a Momentum.</p><a className="google-auth-button" href={authService.googleLoginUrl}><span>G</span>Registrarme con Google</a><div className="auth-divider"><span>o usa tu correo</span></div><form onSubmit={submit}><label>Nombre completo<input name="name" autoComplete="name" required minLength="2" placeholder="Ana Torres" /></label><label>Correo electrónico<input name="email" type="email" autoComplete="email" required placeholder="ana@empresa.com" /></label><div className="auth-form-row"><label>Contraseña<input name="password" type="password" autoComplete="new-password" required minLength="8" placeholder="Mínimo 8 caracteres" /></label><label>Confirmar<input name="confirmPassword" type="password" autoComplete="new-password" required minLength="8" placeholder="Repite la contraseña" /></label></div>{error && <div className="form-error">{error}</div>}<button className="primary-button auth-submit" disabled={saving}>{saving ? 'Creando cuenta…' : <>Crear cuenta <ArrowRight size={16} /></>}</button></form><footer>¿Ya tienes una cuenta? <Link to="/login">Iniciar sesión</Link></footer></div></main></div>
}
