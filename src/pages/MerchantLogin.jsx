import { useEffect, useState } from 'react'
import { Home, MessageCircle, Smartphone } from 'lucide-react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { AuthLoadingScreen } from '../components/auth/ProtectedRoute'

function normalizeError(error) {
  const message = error?.message || ''
  if (message === 'NO_MERCHANT_PERMISSION') return '当前账号未开通商家权限'
  if (message === 'no_permission') return '当前账号未开通商家权限'
  if (message.includes('Authing 环境变量缺失')) return message
  return '登录失败，请稍后重试'
}

export function MerchantLogin() {
  const {
    isAuthenticated,
    loading,
    configError,
    signInWithHostedLogin
  } = useAuth()
  const [accepted, setAccepted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const location = useLocation()

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

  if (loading) return <AuthLoadingScreen text="正在检查登录状态..." />
  if (isAuthenticated) return <Navigate to="/merchant/dashboard" replace />

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (submitting) return
    if (!accepted) {
      setError('请先确认用户协议和隐私政策')
      return
    }

    setError('')
    setSubmitting(true)
    try {
      await signInWithHostedLogin()
    } catch (signInError) {
      setError(normalizeError(signInError))
      setSubmitting(false)
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

        <label className="agreementCheck">
          <input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} />
          <span>我已阅读并同意用户协议和隐私政策</span>
        </label>

        <button className="merchantLoginButton" type="submit" disabled={submitting || Boolean(configError)}>
          {submitting ? '正在跳转...' : '手机号验证码登录'}
        </button>

        <div className="socialLoginBlock">
          <p>其他登录方式</p>
          <span className="socialLoginButton socialLoginButton--disabled" aria-disabled="true">
            <MessageCircle size={18} />
            微信登录 · 即将开放
          </span>
          <span className="socialLoginButton socialLoginButton--disabled" aria-disabled="true">
            <Smartphone size={18} />
            支付宝登录 · 即将开放
          </span>
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
