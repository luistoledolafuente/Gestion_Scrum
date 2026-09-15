import { useCallback, useEffect, useMemo, useState } from 'react'
import { authService } from '../services/auth.service'
import { AuthContext } from './auth-context'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const applyUser = useCallback((nextUser) => {
    setUser(nextUser)
    if (!nextUser) return
    const saved = window.localStorage.getItem('momentum_workspace_id')
    if (!nextUser.workspaces.some((workspace) => workspace.id === saved)) {
      if (nextUser.workspaces[0]) window.localStorage.setItem('momentum_workspace_id', nextUser.workspaces[0].id)
      else window.localStorage.removeItem('momentum_workspace_id')
    }
  }, [])

  const refresh = useCallback(async () => {
    try { applyUser(await authService.me()) }
    catch { applyUser(null) }
    finally { setLoading(false) }
  }, [applyUser])
  useEffect(() => {
    let active = true
    authService.me().then((result) => { if (active) applyUser(result) }).catch(() => { if (active) applyUser(null) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [applyUser])

  const login = useCallback(async (payload) => { const result = await authService.login(payload); applyUser(result); return result }, [applyUser])
  const register = useCallback(async (payload) => { const result = await authService.register(payload); applyUser(result); return result }, [applyUser])
  const logout = useCallback(async () => { await authService.logout(); window.localStorage.removeItem('momentum_workspace_id'); applyUser(null) }, [applyUser])
  const activeWorkspaceId = user ? (window.localStorage.getItem('momentum_workspace_id') || user.workspaces[0]?.id) : null
  const activeWorkspace = user?.workspaces.find((workspace) => workspace.id === activeWorkspaceId) || user?.workspaces[0] || null
  const switchWorkspace = useCallback((workspaceId) => {
    if (!user?.workspaces.some((workspace) => workspace.id === workspaceId)) return
    window.localStorage.setItem('momentum_workspace_id', workspaceId)
    window.location.assign('/')
  }, [user])
  const canEdit = Boolean(activeWorkspace && activeWorkspace.role !== 'CLIENT')
  const value = useMemo(() => ({ user, loading, login, register, logout, refresh, activeWorkspace, switchWorkspace, canEdit }), [user, loading, login, register, logout, refresh, activeWorkspace, switchWorkspace, canEdit])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
