import { useEffect, useMemo, useState } from 'react'
import { Eye, EyeOff, Home } from 'lucide-react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { AuthLoadingScreen } from '../components/auth/ProtectedRoute'

function normalizeError(error) {
  const message = error?.message || ''
  if (message === 'NO_MERCHANT_PERMISSION') return '当前账号没有商家权限'
  if (message.includes('Supabase 环境变量缺失')) return message
  if (message.toLowerCase().includes('invalid login credentials')) return '账号或密码错误'
  if (message.toLowerCase().includes('email')) return '请输入有效邮箱'
  return '登录请求失败，请稍后再试'
}

export function MerchantLogin() {
  const { signIn, isAuthenticated, loading, configError } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const location = useLocation()
  const navigate = useNavigate()

  const redirectTo = useMemo(() => {
    const params = new URLSearchParams(location.search)
    const redirect = params.get('redirect')
    return redirect?.startsWith('/merchant/') ? redirect : '/merchant/dashboard'
  }, [location.search])

  useEffect(() => {
    document.title = '商家登录 | 云栖小院'
    const robots = document.querySelector('meta[name="robots"]') ?? document.createElement('meta')
    robots.setAttribute('name', 'robots')
    robots.setAttribute('content', 'noindex, nofollow')
    document.head.appendChild(robots)
    return () => {
      robots.remove()
      document.title = '云栖小院 | 昆明民宿智能接待'
    }
  }, [])

  if (loading) return <AuthLoadingScreen />
  if (isAuthenticated) return <Navigate to="/merchant/dashboard" replace />

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (submitting) return

    setError('')
    const trimmedEmail = email.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('请输入有效邮箱')
      return
    }

    setSubmitting(true)
    const { error: signInError } = await signIn({ email: trimmedEmail, password })
    setSubmitting(false)

    if (signInError) {
      setError(normalizeError(signInError))
      return
    }

    navigate(redirectTo, { replace: true })
  }

  return (
    <main className="merchantLoginPage">
      <motion.form className="merchantLoginCard" onSubmit={handleSubmit} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
        <Link to="/" className="merchantBrand">云栖小院</Link>
        <div className="merchantLoginTitle">
          <h1>商家登录</h1>
          <p>登录后进入民宿管理中心</p>
        </div>

        {configError && <p className="authConfigError">{configError}</p>}
        {error && <p className="authError">{error}</p>}

        <label className="authField">
          <span>邮箱</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            placeholder="请输入商家邮箱"
            disabled={submitting}
          />
        </label>

        <label className="authField">
          <span>密码</span>
          <div className="passwordInputWrap">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              placeholder="请输入密码"
              disabled={submitting}
            />
            <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? '隐藏密码' : '显示密码'} disabled={submitting}>
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </label>

        <p className="keepLoginHint">保持登录提示：浏览器会使用 Supabase 安全会话保持登录状态，请勿在公共设备上保存登录。</p>

        <button className="merchantLoginButton" type="submit" disabled={submitting || Boolean(configError)}>
          {submitting ? '正在登录...' : '登录'}
        </button>

        <div className="merchantLoginLinks">
          <Link to="/">
            <Home size={17} />
            返回顾客端
          </Link>
          <span>忘记密码请联系管理员在 Supabase 后台重置。</span>
        </div>
      </motion.form>
    </main>
  )
}
