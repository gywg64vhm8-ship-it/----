import { useEffect, useMemo, useState } from 'react'
import { Home, MessageCircle, Smartphone } from 'lucide-react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { isMainlandPhone } from '../lib/authing'
import { useAuth } from '../context/AuthContext'
import { AuthLoadingScreen } from '../components/auth/ProtectedRoute'

function normalizeError(error) {
  const message = error?.message || ''
  if (message === 'NO_MERCHANT_PERMISSION') return '当前账号未开通商家权限'
  if (message === 'no_permission') return '当前账号未开通商家权限'
  if (message.includes('TOO_MANY') || message.includes('频繁')) return '验证码发送过于频繁'
  if (message.includes('验证码') || message.includes('passCode') || message.includes('code')) return '验证码错误或已过期'
  if (message.includes('Authing 环境变量缺失')) return message
  return '登录失败，请稍后重试'
}

export function MerchantLogin() {
  const {
    isAuthenticated,
    loading,
    configError,
    requestPhoneCode,
    signInWithPhone,
    signInWithWechat,
    signInWithAlipay
  } = useAuth()
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [accepted, setAccepted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [sendingCode, setSendingCode] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [error, setError] = useState('')
  const location = useLocation()
  const navigate = useNavigate()

  const redirectTo = useMemo(() => {
    const params = new URLSearchParams(location.search)
    const redirect = params.get('redirect')
    return redirect?.startsWith('/merchant/') ? redirect : '/merchant/dashboard'
  }, [location.search])

  useEffect(() => {
    document.title = '商家管理中心 | 云栖小院'
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
    const params = new URLSearchParams(location.search)
    const nextError = params.get('error')
    if (nextError === 'alipay_cancel') setError('支付宝授权未完成')
    if (nextError === 'no_permission') setError('当前账号未开通商家权限')
  }, [location.search])

  useEffect(() => {
    if (countdown <= 0) return undefined
    const timer = window.setTimeout(() => setCountdown((value) => value - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [countdown])

  if (loading) return <AuthLoadingScreen text="正在检查登录状态..." />
  if (isAuthenticated) return <Navigate to="/merchant/dashboard" replace />

  const handleSendCode = async () => {
    if (sendingCode || countdown > 0) return
    const trimmedPhone = phone.trim()
    if (!isMainlandPhone(trimmedPhone)) {
      setError('请输入正确手机号')
      return
    }
    if (!accepted) {
      setError('请先确认用户协议和隐私政策')
      return
    }

    setError('')
    setSendingCode(true)
    try {
      await requestPhoneCode(trimmedPhone)
      setCountdown(60)
    } catch (sendError) {
      setError(normalizeError(sendError))
    } finally {
      setSendingCode(false)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (submitting) return
    const trimmedPhone = phone.trim()
    if (!isMainlandPhone(trimmedPhone)) {
      setError('请输入正确手机号')
      return
    }
    if (!code.trim()) {
      setError('验证码错误或已过期')
      return
    }
    if (!accepted) {
      setError('请先确认用户协议和隐私政策')
      return
    }

    setError('')
    setSubmitting(true)
    try {
      await signInWithPhone({ phone: trimmedPhone, code: code.trim() })
      navigate(redirectTo, { replace: true })
    } catch (signInError) {
      setError(normalizeError(signInError))
    } finally {
      setSubmitting(false)
    }
  }

  const handleProviderLogin = async (provider) => {
    if (!accepted) {
      setError('请先确认用户协议和隐私政策')
      return
    }
    setError('')
    try {
      if (provider === 'wechat') await signInWithWechat()
      if (provider === 'alipay') await signInWithAlipay()
    } catch (providerError) {
      setError(provider === 'alipay' && providerError?.message === 'cancelled' ? '支付宝授权未完成' : '登录失败，请稍后重试')
    }
  }

  return (
    <main className="merchantLoginPage">
      <motion.form className="merchantLoginCard" onSubmit={handleSubmit} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
        <Link to="/" className="merchantBrand">云栖小院</Link>
        <div className="merchantLoginTitle">
          <h1>商家管理中心</h1>
          <p>请选择登录方式，登录后管理民宿资料</p>
        </div>

        {configError && <p className="authConfigError">{configError}</p>}
        {error && <p className="authError">{error}</p>}

        <label className="authField">
          <span>手机号</span>
          <div className="phoneInputWrap">
            <strong>+86</strong>
            <input
              type="tel"
              inputMode="numeric"
              value={phone}
              onChange={(event) => setPhone(event.target.value.replace(/\D/g, '').slice(0, 11))}
              autoComplete="tel"
              placeholder="请输入中国大陆手机号"
              disabled={submitting}
            />
          </div>
        </label>

        <label className="authField">
          <span>验证码</span>
          <div className="codeInputWrap">
            <input
              type="text"
              inputMode="numeric"
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 8))}
              autoComplete="one-time-code"
              placeholder="请输入短信验证码"
              disabled={submitting}
            />
            <button type="button" onClick={handleSendCode} disabled={sendingCode || countdown > 0 || Boolean(configError)}>
              {countdown > 0 ? `${countdown}秒后重发` : sendingCode ? '发送中...' : '获取验证码'}
            </button>
          </div>
        </label>

        <label className="agreementCheck">
          <input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} />
          <span>我已阅读并同意用户协议和隐私政策</span>
        </label>

        <button className="merchantLoginButton" type="submit" disabled={submitting || Boolean(configError)}>
          {submitting ? '正在登录...' : '登录'}
        </button>

        <div className="socialLoginBlock">
          <p>其他登录方式</p>
          <button type="button" className="socialLoginButton" onClick={() => handleProviderLogin('wechat')} disabled={Boolean(configError)}>
            <MessageCircle size={18} />
            微信登录
          </button>
          <button type="button" className="socialLoginButton" onClick={() => handleProviderLogin('alipay')} disabled={Boolean(configError)}>
            <Smartphone size={18} />
            支付宝登录
          </button>
        </div>

        <div className="merchantLoginLinks">
          <Link to="/">
            <Home size={17} />
            返回顾客端
          </Link>
        </div>
      </motion.form>
    </main>
  )
}
