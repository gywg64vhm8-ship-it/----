import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export function AuthLoadingScreen({ text = '正在验证商家身份...' }) {
  return (
    <div className="authLoadingScreen" role="status" aria-live="polite">
      <span />
      <p>{text}</p>
    </div>
  )
}

export function ProtectedRoute({ children }) {
  const { isAuthenticated, loading, session, verifyMerchant, signOut } = useAuth()
  const [checking, setChecking] = useState(true)
  const [denied, setDenied] = useState(false)
  const location = useLocation()

  useEffect(() => {
    let mounted = true

    async function checkMerchant() {
      if (loading) return
      if (!session?.accessToken) {
        setChecking(false)
        return
      }
      try {
        await verifyMerchant(session)
        if (mounted) setChecking(false)
      } catch {
        if (mounted) {
          setDenied(true)
          setChecking(false)
        }
      }
    }

    checkMerchant()
    return () => {
      mounted = false
    }
  }, [loading, session?.accessToken])

  useEffect(() => {
    if (denied) signOut({ localOnly: true })
  }, [denied])

  if (loading || checking) return <AuthLoadingScreen />

  if (denied) {
    return <Navigate to="/merchant/login?error=no_permission" replace />
  }

  if (!isAuthenticated) {
    const redirect = `${location.pathname}${location.search}${location.hash}`
    return <Navigate to={`/merchant/login?redirect=${encodeURIComponent(redirect)}`} replace />
  }

  return children
}
