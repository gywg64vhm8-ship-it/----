import { useEffect } from 'react'
import { BookOpen, HelpCircle, Home, LogOut, MessageCircle, Settings } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'

const dashboardItems = [
  ['房型管理', '整理房型图片、人数、价格和入住规则。', Home],
  ['常见问题管理', '维护房态、停车、宠物、退订等问答内容。', HelpCircle],
  ['攻略管理', '更新一日游、两日游、亲子游和滇池路线。', BookOpen],
  ['联系方式管理', '替换电话、微信二维码、地址和导航链接。', MessageCircle]
]

export function MerchantDashboard() {
  const { user, merchant, signOut } = useAuth()
  const navigate = useNavigate()

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

  const handleSignOut = async () => {
    await signOut()
    navigate('/merchant/login', { replace: true })
  }

  const loginAccount = user?.phone || user?.email || user?.name || '已绑定账号'
  const loginProvider = merchant?.provider || user?.provider || 'phone'
  const providerLabel = {
    phone: '手机号验证码',
    wechat: '微信登录',
    alipay: '支付宝登录'
  }[loginProvider] || loginProvider

  return (
    <main className="merchantDashboardPage">
      <header className="merchantDashboardTop">
        <Link to="/" className="merchantBrand">云栖小院</Link>
        <button type="button" onClick={handleSignOut}>
          <LogOut size={18} />
          退出登录
        </button>
      </header>

      <section className="merchantDashboardHero">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}>
          <span className="dashboardEyebrow">商家管理中心</span>
          <h1>欢迎回来</h1>
          <div className="merchantIdentityPanel">
            <span>当前商家名称：{merchant?.merchant_name || merchant?.merchantId || '云栖小院'}</span>
            <span>当前登录方式：{providerLabel}</span>
            <span>当前手机号或绑定账号：{loginAccount}</span>
          </div>
        </motion.div>
      </section>

      <section className="merchantDashboardGrid" aria-label="商家功能入口">
        {dashboardItems.map(([title, description, Icon], index) => (
          <motion.article key={title} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.36, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}>
            <Icon size={24} />
            <h2>{title}</h2>
            <p>{description}</p>
            <button type="button">
              <Settings size={17} />
              功能开发中
            </button>
          </motion.article>
        ))}
      </section>
    </main>
  )
}
