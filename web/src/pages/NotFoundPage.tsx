import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

export default function NotFoundPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return <Navigate to="/" replace />
}
