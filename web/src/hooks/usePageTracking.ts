import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { track } from '@/lib/telemetry'

export function usePageTracking() {
  const location = useLocation()
  const startRef = useRef(Date.now())
  const lastPathRef = useRef(location.pathname)

  useEffect(() => {
    const now = Date.now()
    const duration = Math.round((now - startRef.current) / 1000)
    const prevPath = lastPathRef.current

    if (prevPath !== location.pathname && duration > 0) {
      track('page_view', { page: prevPath, duration_seconds: duration })
    }

    startRef.current = now
    lastPathRef.current = location.pathname
  }, [location.pathname])
}
