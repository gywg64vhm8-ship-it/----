import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export function AuthLoadingScreen() {
  return (
    <div className="authLoadingScreen" role="status" aria-live="polite">
      <span />
      <p>正在确认登录状态...</p>
    </div>
  )
}

export function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) return <AuthLoadingScreen />

  if (!isAuthenticated) {
    const redirect = `${location.pathname}${location.search}${location.hash}`
    return <Navigate to={`/merchant/login?redirect=${encodeURIComponent(redirect)}`} replace />
  }

  return children
}
