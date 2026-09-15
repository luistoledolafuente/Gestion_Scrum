import { useCallback, useEffect, useRef, useState } from 'react'

const friendlyError = 'No se pudo actualizar. Revisa tu conexión e intenta nuevamente.'

export function usePolling(fetcher, interval = 30000) {
  const [data, setData] = useState(null)
  const [initialLoading, setInitialLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [lastUpdated, setLastUpdated] = useState(null)
  const mounted = useRef(true)
  const running = useRef(false)
  const hasData = useRef(false)

  const refresh = useCallback(async () => {
    if (running.current) return
    running.current = true
    if (hasData.current) setRefreshing(true)
    else setInitialLoading(true)
    try {
      const nextData = await fetcher()
      if (!mounted.current) return
      setData(nextData)
      hasData.current = true
      setLastUpdated(new Date())
      setError('')
    } catch (requestError) {
      if (mounted.current) setError(requestError.response?.data?.message || friendlyError)
    } finally {
      if (mounted.current) { setInitialLoading(false); setRefreshing(false) }
      running.current = false
    }
  }, [fetcher])

  useEffect(() => {
    mounted.current = true
    const initialTimer = window.setTimeout(refresh, 0)
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') refresh()
    }, interval)
    const onVisibility = () => document.visibilityState === 'visible' && refresh()
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      mounted.current = false
      window.clearTimeout(initialTimer)
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [interval, refresh])

  return { data, initialLoading, refreshing, error, lastUpdated, refresh }
}
