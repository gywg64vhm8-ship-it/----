import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { AuthLoadingScreen } from '../components/auth/ProtectedRoute'

function normalizeCallbackError(error) {
  const message = error?.message || ''
  if (message.includes('access_denied') || message.includes('cancel')) return '支付宝授权未完成'
  if (message === 'missing_access_token') return '未获取到登录凭证，请重新登录'
  if (error?.status === 401) return '登录状态无效，请重新登录'
  if (error?.status === 403 || message === 'NO_MERCHANT_PERMISSION') return '当前账号未开通商家权限'
  if (error?.status >= 500) return '商家权限验证服务异常，请稍后再试'
  return '登录失败，请稍后重试'
}

function loginErrorCode(message) {
  if (message === '支付宝授权未完成') return 'alipay_cancel'
  if (message === '当前账号未开通商家权限') return 'no_permission'
  if (message === '商家权限验证服务异常，请稍后再试') return 'server_error'
  return 'invalid_session'
}

export function AuthCallback() {
  const { handleRedirectCallback, signOut } = useAuth()
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    document.title = '正在验证商家身份 | 云栖小院'
    const robots = document.querySelector('meta[name="robots"]') ?? document.createElement('meta')
    robots.setAttribute('name', 'robots')
    robots.setAttribute('content', 'noindex, nofollow')
    document.head.appendChild(robots)
    return () => {
      robots.remove()
      document.title = '云栖小院 | 昆明民宿智能接待'
    }
  }, [])

  useEffect(() => {
    let mounted = true

    async function verifyCallback() {
      try {
        await handleRedirectCallback()
        if (mounted) navigate('/merchant/dashboard', { replace: true })
      } catch (callbackError) {
        const nextError = normalizeCallbackError(callbackError)
        if (mounted) setError(nextError)
        await signOut({ localOnly: true })
        window.setTimeout(() => {
          navigate(`/merchant/login?error=${loginErrorCode(nextError)}`, { replace: true })
        }, 900)
      }
    }

    verifyCallback()
    return () => {
      mounted = false
    }
  }, [])

  if (error) {
    return (
      <main className="authCallbackPage">
        <div className="authCallbackCard">
          <h1>{error}</h1>
          <p>正在返回商家登录页...</p>
        </div>
      </main>
    )
  }

  return <AuthLoadingScreen text="正在验证商家身份..." />
}
