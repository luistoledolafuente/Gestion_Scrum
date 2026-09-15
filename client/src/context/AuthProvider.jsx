import { useCallback, useEffect, useMemo, useState } from 'react'
import { authService } from '../services/auth.service'
import { AuthContext } from './auth-context'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try { setUser(await authService.me()) }
    catch { setUser(null) }
    finally { setLoading(false) }
  }, [])
  useEffect(() => {
    let active = true
    authService.me().then((result) => { if (active) setUser(result) }).catch(() => { if (active) setUser(null) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const login = async (payload) => { const result = await authService.login(payload); setUser(result); return result }
  const register = async (payload) => { const result = await authService.register(payload); setUser(result); return result }
  const logout = async () => { await authService.logout(); setUser(null) }
  const value = useMemo(() => ({ user, loading, login, register, logout, refresh }), [user, loading, refresh])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
