import { useEffect, useState } from 'react'
import { authing } from '../lib/authing'
import { getAccessToken } from '../context/AuthContext'
import { AuthLoadingScreen } from '../components/auth/ProtectedRoute'

let callbackPromise = null

function processCallbackOnce() {
  if (!callbackPromise) {
    callbackPromise = authing.handleRedirectCallback()
  }
  return callbackPromise
}

async function verifyMerchant(accessToken) {
  const response = await fetch('/api/merchant/me', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json'
    },
    cache: 'no-store'
  })

  const data = await response.json().catch(() => null)
  if (!response.ok) {
    throw Object.assign(
      new Error(data?.error || `merchant_api_${response.status}`),
      { status: response.status, details: data }
    )
  }

  return data
}

function loginErrorCode(error) {
  if (error?.message === 'missing_access_token') return 'missing_token'
  if (error?.message === 'invalid_callback_parameters') return 'invalid_callback'
  if (error?.status === 401) return 'merchant_api_401'
  if (error?.status === 403) return 'merchant_api_403'
  if (error?.status >= 500) return 'merchant_api_500'
  return 'callback_failed'
}

function callbackMessage(error) {
  const code = loginErrorCode(error)
  if (code === 'invalid_callback') return '登录回调参数不完整，请重新登录'
  if (code === 'missing_token') return '未获取到登录凭证，请重新登录'
  if (code === 'merchant_api_401') return '登录凭证无效，请重新登录'
  if (code === 'merchant_api_403') return '当前账号未开通商家权限'
  if (code === 'merchant_api_500') return '商家权限验证服务异常，请稍后再试'
  return '登录回调处理失败，请重新登录'
}

export function AuthCallback() {
  const [error, setError] = useState('')

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
    let cancelled = false

    async function run() {
      try {
        const params = new URLSearchParams(window.location.search)
        const code = params.get('code')
        const state = params.get('state')

        if (!code || !state || !authing?.isRedirectCallback()) {
          throw new Error('invalid_callback_parameters')
        }

        const loginState = await processCallbackOnce()
        if (cancelled) return

        const accessToken = getAccessToken(loginState)
        if (!accessToken) {
          throw new Error('missing_access_token')
        }

        await verifyMerchant(accessToken)
        if (cancelled) return

        window.history.replaceState({}, document.title, '/auth/callback')
        window.location.replace('/merchant/dashboard')
      } catch (callbackError) {
        console.error('Authing callback failed', {
          name: callbackError?.name,
          message: callbackError?.message,
          code: callbackError?.code,
          status: callbackError?.status
        })

        if (!cancelled) setError(callbackMessage(callbackError))
        window.setTimeout(() => {
          if (!cancelled) {
            window.location.replace(`/merchant/login?error=${encodeURIComponent(loginErrorCode(callbackError))}`)
          }
        }, 900)
      }
    }

    run()
    return () => {
      cancelled = true
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
