import { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useTransform
} from 'framer-motion'
import {
  Baby,
  BedDouble,
  CalendarClock,
  CarFront,
  CheckCircle2,
  ChefHat,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  FileText,
  Heart,
  Home,
  Headphones,
  Leaf,
  MapPinned,
  Menu,
  MessageCircle,
  Navigation,
  Phone,
  Plane,
  ReceiptText,
  Route as RouteIcon,
  Send,
  Smile,
  Sparkles,
  TrainFront,
  UsersRound,
  Waves,
  X
} from 'lucide-react'
import homestay from './data/homestay.json'
import { contactConfig, demoContactNote } from './config/contact'
import { findAnswer } from './lib/faq'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { useAuth } from './context/AuthContext'
import { MerchantLogin } from './pages/MerchantLogin'
import { MerchantDashboard } from './pages/MerchantDashboard'
import { AuthCallback } from './pages/AuthCallback'

const ease = [0.22, 1, 0.36, 1]

const iconMap = {
  昆明长水机场: Plane,
  '昆明站 / 昆明南站': TrainFront,
  滇池海埂: MapPinned,
  斗南花市: CarFront
}

const hostActions = [
  { label: '查看推荐路线', href: '#guide' },
  { label: '联系管家', action: 'wechat' },
  { label: '查看房型', href: '#rooms' }
]

const lifestyleImages = {
  courtyard: '/assets/lifestyle/courtyard-flower-entry.webp',
  dianchiSunset: '/assets/kunming/dianchi-sunset.webp',
  dianchiLake: '/assets/kunming/dianchi-lake.webp'
}

const brandStoryPoints = [
  ['在城市与滇池之间', '保留昆明旅居的轻松节奏，到市区和滇池方向都方便。'],
  ['把咨询说清楚', '房型、停车、入住、路线和退订规则集中展示，少一点反复确认。'],
  ['让行程慢下来', '适合短住旅行、亲子周末和看花看湖，不追求赶景点。']
]

const whyChooseItems = [
  ['真实房型信息', '价格、人数、床型、设施和入住规则都集中在数据文件中维护。', BedDouble],
  ['昆明路线建议', '按一日游、两日慢游、亲子和滇池方向整理常见路线。', RouteIcon],
  ['在线接待演示', '常见问题先由本地知识库回答，再把实时房态转给管家确认。', Headphones],
  ['联系路径清楚', '电话、微信、导航和二维码都从统一配置读取，方便替换真实资料。', MessageCircle]
]

const stayScenarios = [
  ['短住旅行', '想看翠湖、老街、南屏街，又希望晚上回到安静房间。'],
  ['亲子周末', '需要更轻松的路线、更多休息时间和清楚的入住指引。'],
  ['看花看湖', '去滇池、斗南花市、西山方向，行程不急，留一点发呆时间。']
]

const customerFaqs = [
  ['这里的信息都真实吗？', '房型结构、价格和联系方式为演示数据；线上素材中图库图片已作为“氛围展示图”处理，不冒充真实客房。'],
  ['房态和价格能直接确认吗？', '不能直接承诺实时有房。实时房态和价格请联系管家确认。'],
  ['可以只看攻略不订房吗？', '可以。路线内容用于帮助你判断昆明行程节奏，具体距离和交通请按当天地图为准。']
]

const revealVariants = {
  hidden: (distance = 24) => ({ opacity: 0, y: distance }),
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease }
  }
}

const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.08 }
  }
}

function RevealSection({ children, className = 'section', id, as = 'section', delay = 0 }) {
  const reduceMotion = useReducedMotion()
  const Component = motion[as]
  return (
    <Component
      id={id}
      className={className}
      variants={revealVariants}
      custom={reduceMotion ? 0 : window.innerWidth < 640 ? 14 : 24}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.18 }}
      transition={{ delay }}
    >
      {children}
    </Component>
  )
}

function StaggerGroup({ children, className }) {
  return (
    <motion.div className={className} variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}>
      {children}
    </motion.div>
  )
}

function PriceCounter({ value }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.8 })
  const reduceMotion = useReducedMotion()
  const [display, setDisplay] = useState(reduceMotion ? Number(value) : 0)

  useEffect(() => {
    if (!isInView) return
    const target = Number(value)
    if (reduceMotion) {
      setDisplay(target)
      return
    }

    let frame = 0
    let start
    const duration = 800
    const tick = (time) => {
      start ??= time
      const progress = Math.min((time - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(target * eased))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [isInView, reduceMotion, value])

  return <span ref={ref}>{display}</span>
}

function Header({ isBusiness = false }) {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [active, setActive] = useState('')
  const { isAuthenticated } = useAuth()
  const { scrollYProgress } = useScroll()
  const links = isBusiness
    ? [
        ['功能介绍', '#features'],
        ['顾客端演示', '/'],
        ['服务套餐', '#packages'],
        ['合作流程', '#process'],
        ['商家登录', isAuthenticated ? '/merchant/dashboard' : '/merchant/login'],
        ['获取方案', '#contact-plan']
      ]
    : [
        ['房型', '#rooms'],
        ['环境', '#space'],
        ['管家', '#consult'],
        ['攻略', '#guide'],
        ['常见问题', '#faq'],
        ['商家合作', '/business'],
        ['预订房间', '#rooms']
      ]

  useEffect(() => {
    const sections = isBusiness ? ['features', 'packages', 'process', 'business-faq'] : ['space', 'rooms', 'consult', 'guide', 'transport', 'faq']
    const update = () => {
      setScrolled(window.scrollY > 60)
      const current = sections.findLast((id) => {
        const node = document.getElementById(id)
        return node && node.getBoundingClientRect().top <= 120
      })
      setActive(current ? `#${current}` : '')
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [isBusiness])

  return (
    <>
      <motion.div className="scrollProgress" style={{ scaleX: scrollYProgress }} />
      <header className={`topNav ${scrolled ? 'isScrolled' : ''}`}>
        <a href={isBusiness ? '/' : '#top'} className="brandMark">
          {homestay.brand.name}
        </a>
        <button className="mobileMenuButton" type="button" onClick={() => setOpen((value) => !value)}>
          <Menu size={18} />
          菜单
        </button>
        <nav className={`navLinks ${open ? 'isOpen' : ''}`} aria-label="页面导航">
          {links.map(([label, href]) => (
            label === '获取方案' ? (
              <button key={label} type="button" className="navCta" onClick={() => {
                setOpen(false)
                window.dispatchEvent(new CustomEvent('open-business-contact'))
              }}>
                {label}
              </button>
            ) : (
              <a key={label} href={href} className={`${active === href ? 'isActive' : ''} ${label === '预订房间' ? 'navCta' : ''}`} onClick={() => setOpen(false)}>
                {label}
              </a>
            )
          ))}
        </nav>
      </header>
    </>
  )
}

function WechatModal({ onClose }) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const copyWechat = async () => {
    try {
      await navigator.clipboard.writeText(contactConfig.wechatId)
    } catch {
      const input = document.createElement('input')
      input.value = contactConfig.wechatId
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    <motion.div className="modalOverlay contactOverlay" role="dialog" aria-modal="true" aria-labelledby="wechat-modal-title" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div className="contactModal wechatModal" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ duration: 0.28, ease }} onClick={(event) => event.stopPropagation()}>
        <button className="modalClose" type="button" onClick={onClose} aria-label="关闭联系弹窗">
          <X size={20} />
        </button>
        <h2 id="wechat-modal-title">添加管家微信</h2>
        <p>添加时请备注“订房咨询”。</p>
        <div className="qrFrame">
          <img src={contactConfig.wechatQr} alt={`微信号 ${contactConfig.wechatId} 二维码`} loading="lazy" decoding="async" width="420" height="420" />
        </div>
        <strong className="wechatId">微信号：{contactConfig.wechatId}</strong>
        <div className="contactModalActions">
          <button type="button" onClick={copyWechat}>
            <Copy size={18} />
            {copied ? '微信号已复制，请打开微信添加' : '复制微信号'}
          </button>
          <a href={`tel:${contactConfig.phone}`}>
            <Phone size={18} />
            电话咨询
          </a>
        </div>
        <p className="demoNotice">{demoContactNote}</p>
      </motion.div>
    </motion.div>
  )
}

function ContactChoiceModal({ onClose, onWechat }) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <motion.div className="modalOverlay contactOverlay" role="dialog" aria-modal="true" aria-labelledby="choice-modal-title" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div className="contactModal choiceModal" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ duration: 0.28, ease }} onClick={(event) => event.stopPropagation()}>
        <button className="modalClose" type="button" onClick={onClose} aria-label="关闭联系选择弹窗">
          <X size={20} />
        </button>
        <h2 id="choice-modal-title">联系管家确认</h2>
        <p>实时房态、价格、入住时间和连住优惠，请通过以下方式确认。</p>
        <div className="choiceActions">
          <a href={`tel:${contactConfig.phone}`}>
            <Phone size={19} />
            电话咨询
          </a>
          <button type="button" onClick={onWechat}>
            <MessageCircle size={19} />
            微信问房
          </button>
          <a href={contactConfig.mapUrl} target="_blank" rel="noreferrer">
            <Navigation size={19} />
            地图导航
          </a>
        </div>
        <p className="demoNotice">{demoContactNote}</p>
      </motion.div>
    </motion.div>
  )
}

function Hero({ brand, onContactChoice }) {
  const ref = useRef(null)
  const reduceMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [0, reduceMotion ? 0 : 60])

  return (
    <section className="hero" id="top" ref={ref}>
      <div className="hero__imageWrap">
        <motion.picture className="hero__picture" style={{ y }}>
          <source media="(max-width: 767px)" srcSet={brand.heroImageMobile} />
          <img
            src={brand.heroImage}
            alt={`${brand.name}民宿房间实拍`}
            className="hero__image"
            loading="eager"
            fetchPriority="high"
            decoding="async"
            width="1536"
            height="1024"
          />
        </motion.picture>
      </div>
      <motion.div className="hero__content" initial="hidden" animate="visible" variants={staggerContainer}>
        <motion.p className="siteName" variants={revealVariants} custom={20}>昆明 · 慢生活民宿</motion.p>
        <motion.h1 variants={revealVariants} custom={20}>
          <span>住进昆明的慢时光，</span>
          <span>醒来就是花香和风。</span>
        </motion.h1>
        <motion.p className="hero__description" variants={revealVariants} custom={20} transition={{ delay: 0.12 }}>
          在城市与滇池之间，留一间有阳光、有温度，也懂你的房间。
        </motion.p>
        <motion.div className="heroActions" variants={revealVariants} custom={20} transition={{ delay: 0.22 }}>
          <button type="button" className="primaryCta" onClick={onContactChoice}>
            <BedDouble size={20} />
            查看房型与价格
          </button>
          <a href="#consult" className="secondaryCta">
            <MessageCircle size={20} />
            咨询智能管家
          </a>
        </motion.div>
        <motion.div className="heroMeta" variants={revealVariants} custom={20}>
          <span>滇池方向</span>
          <span>亲子周末</span>
          <span>演示项目</span>
        </motion.div>
      </motion.div>
      <motion.a className="scrollCue" href="#rooms" aria-label="向下浏览" animate={reduceMotion ? undefined : { y: [0, 7, 0] }} transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}>
        <ChevronDown size={24} />
      </motion.a>
    </section>
  )
}

function FeatureStrip() {
  const features = [
    ['近滇池', '据湖风与花海，步行可达', Waves],
    ['亲子友好', '儿童设施齐全，适合家庭', Smile],
    ['停车方便', '院内停车位充足，自驾无忧', CarFront],
    ['智能管家', '7×24小时在线，随时解答', Headphones]
  ]

  return (
    <motion.section className="featureStrip" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.5 }} variants={staggerContainer} aria-label="民宿亮点">
      {features.map(([title, text, Icon]) => (
        <motion.article key={title} variants={revealVariants}>
          <span><Icon size={24} /></span>
          <div>
            <h2>{title}</h2>
            <p>{text}</p>
          </div>
        </motion.article>
      ))}
    </motion.section>
  )
}

function BrandStory() {
  return (
    <RevealSection className="section storySection" id="story">
      <motion.div className="storyIntro" variants={revealVariants}>
        <p className="sectionEyebrow">About Yunqi</p>
        <h2>
          <span>不是匆忙经过，</span>
          <span>是在昆明多留一阵。</span>
        </h2>
        <p>云栖小院把房型、路线和常见咨询整理成一个可直接浏览的接待页。你可以先看清空间与位置，再把实时房态交给管家确认。</p>
      </motion.div>
      <StaggerGroup className="storyPointGrid">
        {brandStoryPoints.map(([title, text], index) => (
          <motion.article key={title} variants={revealVariants}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <h3>{title}</h3>
            <p>{text}</p>
          </motion.article>
        ))}
      </StaggerGroup>
    </RevealSection>
  )
}

function LifestyleSection() {
  return (
    <RevealSection className="section lifestyleSection" id="space">
      <div className="lifestyleGrid">
        <motion.div className="lifestyleCopy" variants={revealVariants}>
          <p className="sectionEyebrow">Space & Slow Living</p>
          <h2>
            <span>有木质、阳光、</span>
            <span>也有云南院落的松弛感。</span>
          </h2>
          <p>房间以暖色、布艺和自然光为主，适合把行李放下，慢慢计划第二天的滇池、花市和老城路线。</p>
          <p className="assetHint">以下图片为氛围展示图，真实房源照片请联系管家确认。</p>
        </motion.div>
        <motion.div className="lifestyleMosaic" variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.25 }}>
          <motion.figure className="mosaicMain" variants={revealVariants}>
            <img src="/assets/rooms/room-wooden-sunlight.webp" alt="阳光照进木质卧室氛围展示" loading="lazy" decoding="async" width="900" height="675" />
          </motion.figure>
          <motion.figure variants={revealVariants}>
            <img src={lifestyleImages.courtyard} alt="云南院落花草入口氛围展示" loading="lazy" decoding="async" width="900" height="675" />
          </motion.figure>
          <motion.figure variants={revealVariants}>
            <img src={lifestyleImages.dianchiSunset} alt="滇池日落" loading="lazy" decoding="async" width="1100" height="720" />
          </motion.figure>
        </motion.div>
      </div>
    </RevealSection>
  )
}

function WhyChoose() {
  return (
    <RevealSection className="section whySection" id="why">
      <motion.div className="sectionTitle sectionTitle--center" variants={revealVariants}>
        <p className="sectionEyebrow">Why Stay Here</p>
        <h2>为什么选择云栖小院</h2>
        <p>把住前最容易反复问的问题先说清楚，让预订和出行都轻一点。</p>
      </motion.div>
      <StaggerGroup className="whyGrid">
        {whyChooseItems.map(([title, text, Icon]) => (
          <motion.article key={title} variants={revealVariants}>
            <span><Icon size={22} /></span>
            <h3>{title}</h3>
            <p>{text}</p>
          </motion.article>
        ))}
      </StaggerGroup>
    </RevealSection>
  )
}

function StayScenarios() {
  return (
    <RevealSection className="section scenarioSection">
      <motion.div className="scenarioPanel" variants={revealVariants}>
        <div>
          <p className="sectionEyebrow">For Your Trip</p>
          <h2>适合这些昆明小行程</h2>
        </div>
        <StaggerGroup className="scenarioList">
          {stayScenarios.map(([title, text]) => (
            <motion.article key={title} variants={revealVariants}>
              <Heart size={19} />
              <h3>{title}</h3>
              <p>{text}</p>
            </motion.article>
          ))}
        </StaggerGroup>
      </motion.div>
    </RevealSection>
  )
}

function RoomCard({ room, onOpen, onWechat, featured = false }) {
  return (
    <motion.article className={`roomCard ${featured ? 'roomCard--featured' : ''}`} variants={revealVariants}>
      <button className="roomCard__mediaButton" type="button" onClick={() => onOpen(room)}>
        <img src={room.image} alt={room.name} className="roomCard__image" loading="lazy" decoding="async" width="800" height="600" />
        <span className="roomImageBadge">氛围展示图</span>
      </button>
      <div className="roomCard__body">
        <div className="roomCard__head">
          <h3>{room.name}</h3>
          <p>
            <span>¥</span>
            <PriceCounter value={room.price} />
            <small>/晚起</small>
          </p>
        </div>
        <div className="roomMeta">
          <span>
            <UsersRound size={17} />
            {room.capacity}
          </span>
          <span>
            <BedDouble size={17} />
            {room.bed}
          </span>
        </div>
        <div className="facilityList">
          {room.facilities.slice(0, featured ? 5 : 4).map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
        <div className="roomCardActions">
          <button className="textButton" type="button" onClick={() => onOpen(room)}>
            查看房型详情
          </button>
          <button className="roomConsultButton" type="button" onClick={onWechat}>
            立即咨询
          </button>
        </div>
      </div>
    </motion.article>
  )
}

function RoomModal({ room, onClose, onWechat }) {
  const [index, setIndex] = useState(0)

  if (!room) return null

  const image = room.gallery[index]
  const next = () => setIndex((current) => (current + 1) % room.gallery.length)
  const previous = () => setIndex((current) => (current - 1 + room.gallery.length) % room.gallery.length)

  return (
    <motion.div className="modalOverlay" role="dialog" aria-modal="true" aria-labelledby="room-modal-title" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="roomModal" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} transition={{ duration: 0.28, ease }}>
        <button className="modalClose" type="button" onClick={onClose} aria-label="关闭房型详情">
          <X size={20} />
        </button>
        <div className="roomGallery">
          <AnimatePresence mode="wait">
            <motion.img key={image} src={image} alt={`${room.name}图片 ${index + 1}`} loading="lazy" decoding="async" width="800" height="600" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} />
          </AnimatePresence>
          <button className="galleryButton galleryButton--prev" type="button" onClick={previous} aria-label="上一张">
            <ChevronLeft size={22} />
          </button>
          <button className="galleryButton galleryButton--next" type="button" onClick={next} aria-label="下一张">
            <ChevronRight size={22} />
          </button>
          <div className="galleryDots">
            {room.gallery.map((item, dotIndex) => (
              <button
                key={item}
                type="button"
                className={dotIndex === index ? 'isActive' : ''}
                onClick={() => setIndex(dotIndex)}
                aria-label={`查看第${dotIndex + 1}张图片`}
              />
            ))}
          </div>
        </div>
        <div className="roomModal__body">
          <div className="roomModal__head">
            <div>
              <h2 id="room-modal-title">{room.name}</h2>
              <p>{room.capacity} · {room.bed}</p>
            </div>
            <strong>¥{room.price}<span>/晚起</span></strong>
          </div>
          <div className="detailGrid">
            <span><UsersRound size={17} />入住人数：{room.capacity}</span>
            <span><BedDouble size={17} />床型：{room.bed}</span>
            <span><Clock size={17} />入住：{room.checkIn}</span>
            <span><CalendarClock size={17} />退房：{room.checkOut}</span>
            <span><CarFront size={17} />停车：{room.parking}</span>
            <span><ChefHat size={17} />做饭：{room.cooking}</span>
            <span><Home size={17} />宠物：{room.pet}</span>
            <span><FileText size={17} />退订：{room.cancellation}</span>
          </div>
          <div className="facilityList facilityList--modal">
            {room.facilities.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
          <div className="modalActions">
            <button type="button" className="modalPrimaryAction" onClick={onWechat}>联系管家确认</button>
            <button type="button" onClick={onClose}>继续看房型</button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

function Rooms({ rooms, onWechat }) {
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [featuredRoom, ...restRooms] = rooms

  return (
    <RevealSection className="section roomsSection" id="rooms">
      <motion.div className="sectionTitle" variants={revealVariants}>
        <div>
          <p className="sectionEyebrow">Rooms & Price</p>
          <h2>精选房型与价格</h2>
          <p>先看人数、床型、设施和起步价，再联系管家确认实时房态。</p>
        </div>
        <a href="#consult">问问智能管家 →</a>
      </motion.div>
      <StaggerGroup className="roomGrid">
        {featuredRoom && <RoomCard key={featuredRoom.id} room={featuredRoom} onOpen={setSelectedRoom} onWechat={onWechat} featured />}
        {restRooms.map((room) => (
          <RoomCard key={room.id} room={room} onOpen={setSelectedRoom} onWechat={onWechat} />
        ))}
      </StaggerGroup>
      <p className="assetHint roomAssetHint">房型图片含氛围展示图，真实客房照片和实时房态请联系管家确认。</p>
      <AnimatePresence>
        <RoomModal room={selectedRoom} onClose={() => setSelectedRoom(null)} onWechat={onWechat} />
      </AnimatePresence>
    </RevealSection>
  )
}

function TypingDots() {
  return (
    <div className="messageRow messageRow--host">
      <div className="message message--host typingBubble" aria-label="管家正在输入">
        <span />
        <span />
        <span />
      </div>
    </div>
  )
}

function Consultation({ faq, onWechat }) {
  const [question, setQuestion] = useState('')
  const [showAllQuestions, setShowAllQuestions] = useState(false)
  const [pending, setPending] = useState(false)
  const listRef = useRef(null)
  const [messages, setMessages] = useState([
    {
      from: 'host',
      text: faq.initialMessage,
      actions: hostActions
    }
  ])

  const visibleQuestions = showAllQuestions ? faq.quickQuestions : faq.quickQuestions.slice(0, 6)
  const answer = useMemo(() => findAnswer(question, faq.items, faq.fallback), [question, faq])

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, pending])

  const ask = (text = question) => {
    const nextQuestion = text.trim()
    if (!nextQuestion || pending) return
    const nextAnswer = findAnswer(nextQuestion, faq.items, faq.fallback)

    setMessages((current) => [...current, { from: 'guest', text: nextQuestion }])
    setQuestion('')
    setPending(true)
    window.setTimeout(() => {
      setMessages((current) => [...current, { from: 'host', text: nextAnswer.text, actions: hostActions }])
      setPending(false)
    }, 620)
  }

  return (
    <RevealSection className="section consultSection" id="consult">
      <motion.div className="sectionTitle" variants={revealVariants}>
        <div>
          <p className="sectionEyebrow">Smart Host Demo</p>
          <h2>先问问智能管家</h2>
          <p>智能管家演示：用本地知识库回答房态、入住、停车、交通和昆明路线，再引导联系人工管家确认。</p>
        </div>
      </motion.div>

      <div className="consultExperience">
      <motion.aside className="assistantRail" variants={revealVariants}>
        <span><Leaf size={20} /></span>
        <h3>入住前先把问题问清楚</h3>
        <p>试着问“今天还有房吗”“从机场怎么过来”“两天亲子路线怎么安排”。实时房态不会直接承诺，会提示联系管家确认。</p>
        <div>
          <strong>可处理咨询</strong>
          <em>房型匹配</em>
          <em>路线推荐</em>
          <em>停车交通</em>
        </div>
      </motion.aside>

      <motion.div className="chatPanel" variants={revealVariants}>
        <div className="chatHeader">
          <div className="hostAvatar">
            <MessageCircle size={26} />
            <strong>云小栖</strong>
            <span>智能管家</span>
          </div>
          <div className={`quickQuestions ${showAllQuestions ? 'isExpanded' : ''}`} aria-label="快捷问题">
            {visibleQuestions.map((item) => (
              <button key={item} type="button" disabled={pending} onClick={() => ask(item)}>
                {item}
              </button>
            ))}
            {faq.quickQuestions.length > 6 && (
              <button className="moreQuestionButton" type="button" onClick={() => setShowAllQuestions((value) => !value)}>
                {showAllQuestions ? '收起问题' : '更多问题'}
              </button>
            )}
          </div>
        </div>

        <div className="messageList" aria-live="polite" ref={listRef}>
          <AnimatePresence initial={false}>
            {messages.map((message, index) => (
              <motion.div
                className={`messageRow messageRow--${message.from}`}
                key={`${message.from}-${index}-${message.text}`}
                initial={{ opacity: 0, x: message.from === 'guest' ? 14 : -14, y: 10 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.28, ease }}
              >
                <div className={`message message--${message.from}`}>
                  <span className="messageName">{message.from === 'host' ? '管家' : '你'}</span>
                  {message.text}
                </div>
                {message.actions && (
                  <motion.div className="messageActions" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12, duration: 0.24 }}>
                    {message.actions.map((action) => (
                      action.action === 'wechat' ? (
                        <button key={action.label} type="button" onClick={onWechat}>
                          {action.label}
                        </button>
                      ) : (
                        <a key={action.label} href={action.href}>
                          {action.label}
                        </a>
                      )
                    ))}
                  </motion.div>
                )}
              </motion.div>
            ))}
            {pending && <TypingDots key="typing" />}
          </AnimatePresence>
        </div>

        <form
          className="askForm"
          onSubmit={(event) => {
            event.preventDefault()
            ask()
          }}
        >
          <input
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="输入问题，比如：两天亲子路线怎么安排？"
            aria-label="咨询问题"
            disabled={pending}
          />
          <button type="submit" aria-label="发送问题" disabled={pending}>
            <Send size={20} />
          </button>
        </form>

        {question.trim() && <p className="answerPreview">可能回复：{answer.text}</p>}
      </motion.div>
      </div>
    </RevealSection>
  )
}

function TravelGuides({ guides }) {
  const [openIndex, setOpenIndex] = useState(null)
  return (
    <RevealSection className="section guideSection" id="guide">
      <motion.div className="sectionTitle" variants={revealVariants}>
        <div>
          <p className="sectionEyebrow">Kunming Routes</p>
          <h2>从小院出发的昆明慢游</h2>
          <p>按常见住客节奏整理，减少来回折腾。具体交通时间请以当天地图为准。</p>
        </div>
      </motion.div>
      <div className="guideLayout">
        <motion.figure className="guideVisual" variants={revealVariants}>
          <img src={lifestyleImages.dianchiSunset} alt="滇池日落路线氛围图" loading="lazy" decoding="async" width="1100" height="720" />
          <figcaption>滇池日落 / Wikimedia Commons CC BY-SA</figcaption>
        </motion.figure>
        <StaggerGroup className="guideList">
          {guides.map((guide, index) => (
            <motion.article className={`guideItem ${openIndex === index ? 'isExpanded' : ''}`} key={guide.title} variants={revealVariants}>
              <button className="guideButton" type="button" onClick={() => setOpenIndex(openIndex === index ? null : index)}>
                <div className="guideIcon">
                  {guide.title.includes('亲子') ? <Baby size={22} /> : <Sparkles size={22} />}
                </div>
                <div>
                  <span>从民宿出发</span>
                  <h3>{guide.title}</h3>
                  <p className="routeText">{guide.route}</p>
                </div>
              </button>
              <AnimatePresence initial={false}>
                {openIndex === index && (
                  <motion.div className="guideDetail" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.32, ease }}>
                    <p className="tipText">{guide.tip}</p>
                    <div className="guideMeta">
                      <em>推荐时长：按当天节奏调整</em>
                      <em>交通方式：打车 / 地铁 / 步行组合</em>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.article>
          ))}
        </StaggerGroup>
      </div>
    </RevealSection>
  )
}

function Transport({ items }) {
  return (
    <RevealSection className="section transportSection" id="transport">
      <motion.div className="sectionTitle" variants={revealVariants}>
        <div>
          <p className="sectionEyebrow">Around Kunming</p>
          <h2>周边景点与交通</h2>
          <p>到店与出游的常用路线，先有个时间概念；高峰和天气变化请以地图为准。</p>
        </div>
      </motion.div>
      <StaggerGroup className="transportGrid">
        {items.map((item) => {
          const Icon = iconMap[item.place] ?? Navigation
          return (
            <motion.article className="transportCard" key={item.place} variants={revealVariants}>
              <motion.span className="transportIcon" initial={{ scale: 0.92 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.35, ease }}>
                <Icon size={24} />
              </motion.span>
              <h3>{item.place}</h3>
              <strong>{item.time}</strong>
              <p>{item.detail}</p>
            </motion.article>
          )
        })}
      </StaggerGroup>
    </RevealSection>
  )
}

function CustomerFaq() {
  return (
    <RevealSection className="section customerFaqSection" id="faq">
      <motion.div className="sectionTitle sectionTitle--center" variants={revealVariants}>
        <p className="sectionEyebrow">Before Booking</p>
        <h2>常见问题与演示说明</h2>
        <p>把边界讲清楚，比用虚假评价和订单量更重要。</p>
      </motion.div>
      <StaggerGroup className="customerFaqGrid">
        {customerFaqs.map(([questionText, answerText]) => (
          <motion.article key={questionText} variants={revealVariants}>
            <h3>{questionText}</h3>
            <p>{answerText}</p>
          </motion.article>
        ))}
      </StaggerGroup>
    </RevealSection>
  )
}

function ContactBar({ onWechat }) {
  return (
    <nav className="contactBar" aria-label="联系民宿">
      <a href={`tel:${contactConfig.phone}`}>
        <Phone size={20} />
        电话咨询
      </a>
      <button type="button" onClick={onWechat}>
        <MessageCircle size={20} />
        微信问房
      </button>
      <a href={contactConfig.mapUrl} target="_blank" rel="noreferrer">
        <Navigation size={20} />
        地图导航
      </a>
    </nav>
  )
}

function FloatingContact({ onWechat }) {
  return (
    <div className="floatingContact" aria-label="快捷联系">
      <button type="button" onClick={onWechat}>
        <MessageCircle size={19} />
        微信问房
      </button>
      <a href={`tel:${contactConfig.phone}`}>
        <Phone size={19} />
        电话咨询
      </a>
    </div>
  )
}

function DemoNotice() {
  return <p className="demoNotice">{demoContactNote}</p>
}

function ContactFooter({ onWechat }) {
  const [copied, setCopied] = useState(false)

  const copyWechat = async () => {
    try {
      await navigator.clipboard.writeText(contactConfig.wechatId)
    } catch {
      const input = document.createElement('input')
      input.value = contactConfig.wechatId
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    <RevealSection className="contactFooter" as="section" id="contact">
      <div className="contactFooterGrid">
        <article className="contactFooterCard">
          <h2>联系民宿管家</h2>
          <dl className="contactInfoList">
            <div>
              <dt>电话</dt>
              <dd>{contactConfig.phone}<span>{demoContactNote}</span></dd>
            </div>
            <div>
              <dt>微信</dt>
              <dd>{contactConfig.wechatId}<span>{demoContactNote}</span></dd>
            </div>
            <div>
              <dt>服务时间</dt>
              <dd>{contactConfig.serviceHours}<span>{demoContactNote}</span></dd>
            </div>
            <div>
              <dt>地址</dt>
              <dd>{contactConfig.address}<span>{demoContactNote}</span></dd>
            </div>
          </dl>
          <a className="footerPrimaryButton" href={`tel:${contactConfig.phone}`}>
            <Phone size={18} />
            电话咨询
          </a>
        </article>

        <article className="contactFooterCard qrContactCard">
          <h2>扫码添加微信</h2>
          <div className="footerQrFrame">
            <img src={contactConfig.wechatQr} alt={`微信号 ${contactConfig.wechatId} 二维码`} loading="lazy" decoding="async" width="420" height="420" />
          </div>
          <strong>微信号：{contactConfig.wechatId}</strong>
          <button type="button" onClick={copyWechat}>
            <Copy size={18} />
            {copied ? '微信号已复制' : '复制微信号'}
          </button>
          <p>咨询实时房态、价格、入住时间及连住优惠</p>
        </article>

        <article className="contactFooterCard quickEntryCard">
          <h2>快捷入口</h2>
          <button type="button" onClick={onWechat}>
            <MessageCircle size={18} />
            微信问房
          </button>
          <a href={contactConfig.mapUrl} target="_blank" rel="noreferrer">
            <Navigation size={18} />
            地图导航
          </a>
          <a href="#rooms">
            <BedDouble size={18} />
            查看房型
          </a>
          <a href="#guide">
            <MapPinned size={18} />
            昆明旅游攻略
          </a>
        </article>
      </div>
      <p className="footerCopyright">云栖小院智能接待功能演示，民宿名称、价格和联系方式均为演示数据。</p>
      <div className="footerMinorLinks">
        <a className="merchantEntryLink" href="/business">商家合作</a>
        <a className="merchantEntryLink" href="/merchant/login">管理入口</a>
      </div>
    </RevealSection>
  )
}

function HomePage() {
  const [wechatOpen, setWechatOpen] = useState(false)
  const [choiceOpen, setChoiceOpen] = useState(false)
  const openWechat = () => {
    setChoiceOpen(false)
    setWechatOpen(true)
  }
  const openContactChoice = () => setChoiceOpen(true)

  return (
    <>
      <Header />
      <main>
        <Hero brand={homestay.brand} onContactChoice={openContactChoice} />
        <FeatureStrip />
        <BrandStory />
        <LifestyleSection />
        <Rooms rooms={homestay.rooms} onWechat={openWechat} />
        <WhyChoose />
        <Consultation faq={homestay.faq} onWechat={openWechat} />
        <TravelGuides guides={homestay.travelGuides} />
        <Transport items={homestay.transport} />
        <StayScenarios />
        <CustomerFaq />
        <RevealSection className="closing" as="section">
          <p className="sectionEyebrow">Book With Ease</p>
          <h2>想确认日期和房态？</h2>
          <p>直接电话或微信联系管家，告诉我们入住日期、人数和大概行程即可。我们将为你安排合适的房型，期待与你在云栖小院相遇。</p>
          <button type="button" className="closingCta" onClick={openContactChoice}>
            查询房型与价格
            <CalendarClock size={18} />
          </button>
          <p className="closingHint">实时房态和价格请联系管家确认。</p>
          <DemoNotice />
        </RevealSection>
        <ContactFooter onWechat={openWechat} />
      </main>
      <FloatingContact onWechat={openWechat} />
      <ContactBar onWechat={openWechat} />
      <AnimatePresence>
        {wechatOpen && <WechatModal onClose={() => setWechatOpen(false)} />}
        {choiceOpen && <ContactChoiceModal onClose={() => setChoiceOpen(false)} onWechat={openWechat} />}
      </AnimatePresence>
    </>
  )
}

const packageDetails = [
  {
    name: '体验版',
    price: '399元',
    intro: '适合先做一个可分享的基础接待页。',
    items: ['最多3个房型', '20条问答', '2条路线', '联系方式配置', '修改1次', '3个工作日交付']
  },
  {
    name: '标准版',
    price: '999元',
    intro: '适合需要更完整转化链路的民宿。',
    items: ['最多8个房型', '50条问答', '6条路线', '房型详情', '图片轮播', '文案整理', '修改3次', '一个月基础维护', '5至7个工作日交付']
  }
]

function BusinessPage() {
  const [contactOpen, setContactOpen] = useState(false)
  const openContact = () => setContactOpen(true)
  const reduceMotion = useReducedMotion()
  const features = [
    ['自动问答', '用本地知识库先接住常见咨询，减少重复回复。'],
    ['旅游路线', '按一日游、两日游、亲子和滇池路线生成可直接发送的建议。'],
    ['房型展示', '把房型、价格、设施、规则集中展示，方便客人快速判断。'],
    ['微信转化', '每个关键回答都引导联系管家，把咨询沉淀到私域。']
  ]
  const process = ['提交资料', '整理制作', '在线确认', '正式上线']
  const deliverables = ['顾客端手机页面', '商家转化说明页', '房型与问答JSON数据', 'Cloudflare Pages部署产物', '联系方式与导航配置', '后续替换资料说明']
  const faqs = [
    ['需要自己买域名吗？', '可以先使用部署平台默认域名；如果你有自己的域名，也可以协助绑定。'],
    ['部署在哪里？', '默认按静态网站方式部署到 Cloudflare Pages，不需要数据库。'],
    ['后续内容能改吗？', '房型、路线、问答和联系方式集中在数据文件中，后续可以继续替换。'],
    ['和美团、携程、民宿平台是什么关系？', '这是独立展示与接待页面，不替代平台订单系统，可作为私域获客入口。'],
    ['能保证带来多少订单吗？', '不承诺具体订单数量。页面能提升信息展示和咨询承接效率，实际转化还取决于房源、价格、流量和运营。']
  ]

  useEffect(() => {
    window.addEventListener('open-business-contact', openContact)
    return () => window.removeEventListener('open-business-contact', openContact)
  }, [])

  return (
    <>
      <Header isBusiness />
      <main className="businessPage">
        <section className="businessHero">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
            <motion.h1 variants={revealVariants} custom={20}>给你的民宿配一位全天在线的智能管家</motion.h1>
            <motion.p variants={revealVariants} custom={20}>把房型展示、常见咨询、昆明路线和微信转化做成一个手机端接待页，客人随时能问，管家集中接单。</motion.p>
            <motion.div className="businessHeroActions" variants={revealVariants} custom={20}>
              <a href="/" className="primaryCta businessGhostCta">查看顾客端演示</a>
              <motion.button type="button" className="primaryCta businessCta pulseCta" onClick={openContact} animate={reduceMotion ? undefined : { boxShadow: ['0 12px 24px rgba(156, 85, 56, 0.18)', '0 18px 34px rgba(156, 85, 56, 0.28)', '0 12px 24px rgba(156, 85, 56, 0.18)'] }} transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}>
                获取同款接待页面
              </motion.button>
            </motion.div>
          </motion.div>
        </section>

        <RevealSection className="businessSection" id="features">
          <StaggerGroup className="businessFeatureGrid">
            {features.map(([title, text]) => (
              <motion.article className="businessCard" key={title} variants={revealVariants}>
                <CheckCircle2 size={24} />
                <h2>{title}</h2>
                <p>{text}</p>
              </motion.article>
            ))}
          </StaggerGroup>
        </RevealSection>

        <section className="businessSection compareSection">
          <div className="sectionTitle">
            <h2>经营方式对比</h2>
            <p>不夸大效果，只把重复咨询、路线解释和房型说明先整理清楚。</p>
          </div>
          <div className="compareGrid">
            <motion.article initial={{ opacity: 0, x: reduceMotion ? 0 : -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: 0.35 }} transition={{ duration: 0.5, ease }}>
              <h3>传统经营方式</h3>
              <p>客人反复问房态、停车、入住时间和路线，消息分散在电话、微信与平台里，回复慢时容易流失。</p>
            </motion.article>
            <motion.article initial={{ opacity: 0, x: reduceMotion ? 0 : 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: 0.35 }} transition={{ duration: 0.5, ease }}>
              <h3>使用智能接待后</h3>
              <p>先由页面完成基础解答和路线推荐，再把高意向客人引导到微信或电话，由管家确认房态和价格。</p>
            </motion.article>
          </div>
        </section>

        <RevealSection className="businessSection packages" id="packages">
          <motion.div className="sectionTitle" variants={revealVariants}>
            <h2>服务套餐</h2>
            <p>适合先做一个可分享、可迭代的民宿接待页。</p>
          </motion.div>
          <StaggerGroup className="packageGrid">
            {packageDetails.map((item) => (
              <motion.article key={item.name} className={item.name === '标准版' ? 'isFeatured' : ''} variants={revealVariants}>
                <ReceiptText size={24} />
                <h3>{item.name}</h3>
                <strong>{item.price}</strong>
                <p>{item.intro}</p>
                <ul>
                  {item.items.map((detail) => (
                    <li key={detail}>{detail}</li>
                  ))}
                </ul>
              </motion.article>
            ))}
          </StaggerGroup>
          <button type="button" className="packageCta pulseCta" id="contact-plan" onClick={openContact}>获取同款民宿智能接待页面</button>
        </RevealSection>

        <RevealSection className="businessSection processSection" id="process">
          <motion.div className="sectionTitle" variants={revealVariants}>
            <h2>合作流程</h2>
            <p>资料越清楚，页面上线越快。</p>
          </motion.div>
          <StaggerGroup className="processGrid">
            {process.map((step, index) => (
              <motion.article key={step} variants={revealVariants}>
                <span>{index + 1}</span>
                <h3>{step}</h3>
              </motion.article>
            ))}
          </StaggerGroup>
        </RevealSection>

        <RevealSection className="businessSection deliverSection">
          <motion.div className="sectionTitle" variants={revealVariants}>
            <h2>最终交付内容</h2>
            <p>交付的是可部署、可替换资料的前端项目。</p>
          </motion.div>
          <StaggerGroup className="deliverGrid">
            {deliverables.map((item) => (
              <motion.span key={item} variants={revealVariants}><CheckCircle2 size={18} />{item}</motion.span>
            ))}
          </StaggerGroup>
        </RevealSection>

        <RevealSection className="businessSection faqSection" id="business-faq">
          <motion.div className="sectionTitle" variants={revealVariants}>
            <h2>常见问题</h2>
            <p>把边界说清楚，合作更省心。</p>
          </motion.div>
          <StaggerGroup className="businessFaqList">
            {faqs.map(([faqQuestion, faqAnswer]) => (
              <motion.article key={faqQuestion} variants={revealVariants}>
                <h3>{faqQuestion}</h3>
                <p>{faqAnswer}</p>
              </motion.article>
            ))}
          </StaggerGroup>
        </RevealSection>

        <p className="businessFootnote">当前云栖小院为功能演示项目，联系方式、价格和房态均为演示数据。</p>
      </main>
      <AnimatePresence>
        {contactOpen && <WechatModal onClose={() => setContactOpen(false)} />}
      </AnimatePresence>
    </>
  )
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/business" element={<BusinessPage />} />
      <Route path="/merchant/login" element={<MerchantLogin />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route
        path="/merchant/dashboard"
        element={
          <ProtectedRoute>
            <MerchantDashboard />
          </ProtectedRoute>
        }
      />
      {['/merchant/rooms', '/merchant/faq', '/merchant/guides', '/merchant/contact'].map((path) => (
        <Route
          key={path}
          path={path}
          element={
            <ProtectedRoute>
              <MerchantDashboard />
            </ProtectedRoute>
          }
        />
      ))}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
