import { useEffect, useRef, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { authing } from '../../lib/authing'
import { getAccessToken, useAuth } from '../../context/AuthContext'

export function AuthLoadingScreen({ text = '正在验证商家身份...' }) {
  return (
    <div className="authLoadingScreen" role="status" aria-live="polite">
      <span />
      <p>{text}</p>
    </div>
  )
}

function AuthServiceError() {
  return (
    <main className="authCallbackPage">
      <div className="authCallbackCard">
        <h1>商家身份验证服务异常，请稍后再试</h1>
        <p>请稍后刷新页面，或返回商家登录页重新进入。</p>
      </div>
    </main>
  )
}

export function ProtectedRoute({ children }) {
  const { loading, merchant, verifyMerchant } = useAuth()
  const verifyMerchantRef = useRef(verifyMerchant)
  const checkedRef = useRef(false)
  const [status, setStatus] = useState('checking')
  const location = useLocation()

  useEffect(() => {
    verifyMerchantRef.current = verifyMerchant
  }, [verifyMerchant])

  useEffect(() => {
    console.log('ProtectedRoute state', {
      status,
      loading,
      hasMerchant: Boolean(merchant)
    })
  }, [status, loading, merchant])

  useEffect(() => {
    let cancelled = false
    if (checkedRef.current) return undefined
    checkedRef.current = true

    async function checkAccess() {
      try {
        const loginState = await authing.getLoginState({ ignoreCache: false })
        if (cancelled) return

        const accessToken = getAccessToken(loginState)
        if (!accessToken) {
          setStatus('missing_session')
          return
        }

        const data = await verifyMerchantRef.current(accessToken, loginState)
        if (cancelled) return

        console.log('Merchant API success', {
          status: 200,
          merchantFound: Boolean(data?.merchant),
          role: data?.merchant?.role || null
        })
        setStatus('authorized')
        return
      } catch (error) {
        if (cancelled) return
        if (error?.status === 403) setStatus('merchant_not_authorized')
        else if (error?.status >= 500) setStatus('service_error')
        else setStatus('invalid_session')
      }
    }

    checkAccess()
    return () => {
      cancelled = true
    }
  }, [])

  if (status === 'checking') return <AuthLoadingScreen />

  if (status === 'service_error') return <AuthServiceError />

  if (status === 'merchant_not_authorized') {
    return <Navigate to="/merchant/login?error=merchant_not_authorized" replace />
  }

  if (status === 'invalid_session') {
    return <Navigate to="/merchant/login?error=invalid_session" replace />
  }

  if (status === 'missing_session') {
    const redirect = `${location.pathname}${location.search}${location.hash}`
    return <Navigate to={`/merchant/login?redirect=${encodeURIComponent(redirect)}`} replace />
  }

  return children
}
