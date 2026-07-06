import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
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

function stageText(stage) {
  if (stage === 'processing_callback') return '正在处理登录回调...'
  if (stage === 'verifying_merchant') return '正在验证商家权限...'
  if (stage === 'redirecting') return '验证成功，正在进入商家后台...'
  return '正在验证商家身份...'
}

function readableMessage(error) {
  const messageMap = {
    invalid_callback_parameters: '登录回调参数不完整，请重新登录',
    missing_access_token: '未获取到登录凭证，请重新登录',
    invalid_session: '登录状态无效，请重新登录',
    merchant_not_authorized: '当前账号未开通商家权限',
    merchant_service_error: '商家身份验证服务异常，请稍后再试'
  }

  return messageMap[error?.message] || `登录回调处理失败：${error?.code || error?.message || '未知错误'}`
}

export function AuthCallback() {
  const [stage, setStage] = useState('processing_callback')
  const [errorMessage, setErrorMessage] = useState('')
  const [errorDetail, setErrorDetail] = useState(null)

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
        setStage('processing_callback')
        setErrorMessage('')
        setErrorDetail(null)

        if (window.location.pathname !== '/auth/callback') {
          throw new Error('invalid_callback_parameters')
        }

        const params = new URLSearchParams(window.location.search)
        const code = params.get('code')
        const state = params.get('state')

        if (!code || !state) {
          throw new Error('invalid_callback_parameters')
        }

        const loginState = await processCallbackOnce()
        if (cancelled) return

        const accessToken = getAccessToken(loginState)

        console.log('Auth callback debug', {
          pathname: window.location.pathname,
          hasCode: Boolean(code),
          hasState: Boolean(state),
          hasAccessToken: Boolean(accessToken),
          tokenLength: accessToken?.length || 0
        })

        if (!accessToken) {
          throw new Error('missing_access_token')
        }

        setStage('verifying_merchant')

        const controller = new AbortController()
        const timeoutId = window.setTimeout(() => {
          controller.abort()
        }, 15000)

        let response
        try {
          response = await fetch('/api/merchant/me', {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: 'application/json'
            },
            cache: 'no-store',
            signal: controller.signal
          })
        } finally {
          window.clearTimeout(timeoutId)
        }

        const data = await response.json().catch(() => null)
        if (cancelled) return

        if (response.ok) {
          setStage('redirecting')
          window.history.replaceState({}, document.title, '/auth/callback')
          window.location.replace('/merchant/dashboard')
          return
        }

        if (response.status === 401) {
          throw Object.assign(new Error('invalid_session'), { status: 401, details: data })
        }

        if (response.status === 403) {
          throw Object.assign(new Error('merchant_not_authorized'), { status: 403, details: data })
        }

        throw Object.assign(new Error('merchant_service_error'), { status: response.status, details: data })
      } catch (error) {
        if (cancelled) return

        console.error('Authing callback failed', {
          name: error?.name,
          message: error?.message,
          code: error?.code,
          status: error?.status,
          sdkError: error?.response?.data ?? null
        })

        setStage('error')
        setErrorMessage(readableMessage(error))
        setErrorDetail({
          code: error?.code || null,
          message: error?.message || 'unknown_error',
          status: error?.status || null
        })
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [])

  if (stage === 'error') {
    return (
      <main className="authCallbackPage">
        <div className="authCallbackCard">
          <h1>{errorMessage}</h1>
          {errorDetail && (
            <p className="authCallbackDetail">
              错误信息：{errorDetail.code || errorDetail.message}
              {errorDetail.status ? ` · 状态码 ${errorDetail.status}` : ''}
            </p>
          )}
          <div className="authCallbackActions">
            <Link to="/merchant/login">重新登录</Link>
            <Link to="/">返回顾客端</Link>
          </div>
        </div>
      </main>
    )
  }

  return <AuthLoadingScreen text={stageText(stage)} />
}
