import { useEffect, useState } from 'react'
import { Flower2, Home, House, MessageCircle, Smartphone } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
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
    if (nextError === 'invalid_session') setError('登录状态无效，请重新登录')
    if (nextError === 'server_error') setError('商家权限验证服务异常，请稍后再试')
    if (nextError === 'service_error') setError('商家权限验证服务异常，请稍后再试')
    if (nextError === 'merchant_not_authorized') setError('当前账号未开通商家权限')
    if (nextError === 'invalid_callback') setError('登录回调参数不完整，请重新登录')
    if (nextError === 'missing_token') setError('未获取到登录凭证，请重新登录')
    if (nextError === 'callback_failed') setError('登录回调处理失败，请重新登录')
    if (nextError === 'redirect_loop') setError('检测到登录跳转异常，请关闭页面后重新登录。')
    if (nextError === 'merchant_api_401') setError('登录凭证无效，请重新登录')
    if (nextError === 'merchant_api_403') setError('当前账号未开通商家权限')
    if (nextError === 'merchant_api_500') setError('商家权限验证服务异常，请稍后再试')
  }, [location.search])

  if (loading) return <AuthLoadingScreen text="正在检查登录状态..." />

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
      <motion.aside className="merchantLoginIntro" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
        <Link to="/" className="merchantIntroBrand" aria-label="返回云栖小院顾客端">
          <House size={36} strokeWidth={1.7} />
          <span>云栖小院</span>
        </Link>

        <div className="merchantIntroCopy">
          <h1>让每一处小院<br />成为旅人的心安之所</h1>
          <span aria-hidden="true" />
          <p>云栖小院致力于为民宿商家提供高效、便捷的管理工具<br />帮助您轻松管理房源、订单与旅客体验</p>
        </div>

        <p className="merchantIntroFoot">
          <Flower2 size={22} strokeWidth={1.6} />
          安放心院 · 云栖相伴
        </p>
      </motion.aside>

      <section className="merchantLoginVisual" aria-label="商家登录">
        <motion.form className="merchantLoginCard" onSubmit={handleSubmit} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
          <Link to="/" className="merchantBrand">云栖小院</Link>
          <div className="merchantLoginTitle">
            <h1>商家管理中心</h1>
            <p>请选择登录方式，登录后管理民宿资料</p>
          </div>

          {configError && <p className="authConfigError">{configError}</p>}
          {error && <p className="authError">{error}</p>}

          <label className="agreementCheck">
            <input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} />
            <span>
              我已阅读并同意
              <Link to="/business#business-faq">用户协议</Link>
              和
              <Link to="/business#business-faq">隐私政策</Link>
            </span>
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
              <Home size={18} />
              返回顾客端
            </Link>
          </div>
        </motion.form>
      </section>
    </main>
  )
}
