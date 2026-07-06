import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { getAccessToken, useAuth } from '../../context/AuthContext'

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
  const [authError, setAuthError] = useState('')
  const location = useLocation()

  useEffect(() => {
    let mounted = true

    async function checkMerchant() {
      if (loading) return
      const accessToken = getAccessToken(session)
      if (!accessToken) {
        setChecking(false)
        return
      }
      try {
        await verifyMerchant(accessToken, session)
        if (mounted) setChecking(false)
      } catch (error) {
        if (mounted) {
          if (error?.status === 403) setAuthError('no_permission')
          else if (error?.status >= 500) setAuthError('server_error')
          else setAuthError('invalid_session')
          setChecking(false)
        }
      }
    }

    checkMerchant()
    return () => {
      mounted = false
    }
  }, [loading, session])

  useEffect(() => {
    if (authError) signOut({ localOnly: true })
  }, [authError])

  if (loading || checking) return <AuthLoadingScreen />

  if (authError) {
    return <Navigate to={`/merchant/login?error=${authError}`} replace />
  }

  if (!isAuthenticated) {
    const redirect = `${location.pathname}${location.search}${location.hash}`
    return <Navigate to={`/merchant/login?redirect=${encodeURIComponent(redirect)}`} replace />
  }

  return children
}
