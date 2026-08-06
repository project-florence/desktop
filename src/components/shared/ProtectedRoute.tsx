import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import type { ReactNode } from 'react'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const loading = useAuthStore((s) => s.loading)
  const authError = useAuthStore((s) => s.authError)

  useEffect(() => {
    if (!isAuthenticated) {
      useAuthStore.getState().checkAuth()
    }
  }, [isAuthenticated])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (authError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-sm text-muted-foreground">Sunucuya ulaşılamadı.</p>
        <button
          type="button"
          className="rounded-md border px-3 py-2 text-sm"
          onClick={() => useAuthStore.getState().checkAuth()}
        >
          Tekrar dene
        </button>
      </div>
    )
  }

  if (!isAuthenticated) return <Navigate to="/" replace />
  return <>{children}</>
}
