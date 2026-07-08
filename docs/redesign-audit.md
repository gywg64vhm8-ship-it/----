# 云栖小院视觉重构审计

## 1. 当前技术栈和构建命令

- 前端框架：React 18 + Vite 6。
- 路由：React Router 7。
- 动效：Framer Motion。
- 图标：lucide-react。
- 商家认证：Authing Web SDK。
- 服务端接口：Cloudflare Pages Functions。
- JWT 验证：jose。
- 数据存储：顾客端内容使用本地 JSON；商家权限使用 Cloudflare D1。
- 构建命令：`pnpm build`。
- 本地开发：`pnpm dev`。
- 本地生产预览：`pnpm preview`。

## 2. 当前主要路由

- `/`：顾客端民宿官网首页。
- `/business`：公开商家合作介绍页。
- `/merchant/login`：商家登录页。
- `/auth/callback`：Authing 登录回调页。
- `/merchant/dashboard`：受保护商家后台。
- `/merchant/rooms`：受保护，当前复用商家后台。
- `/merchant/faq`：受保护，当前复用商家后台。
- `/merchant/guides`：受保护，当前复用商家后台。
- `/merchant/contact`：受保护，当前复用商家后台。
- `*`：跳转回首页。

## 3. 顾客端页面结构

当前首页由 `src/App.jsx` 内的组件组合：

- Header：顶部导航、滚动进度、移动菜单。
- Hero：首屏大图、标题、CTA。
- FeatureStrip：四个卖点。
- Rooms：房型卡片、价格动画、房型弹窗和图片轮播。
- Consultation：本地关键词智能问答、快捷问题、聊天消息。
- TravelGuides：昆明路线卡片，支持展开。
- Transport：交通信息卡片。
- Closing：预订行动区。
- ContactFooter：完整联系方式、二维码、底部商家入口。
- FloatingContact / ContactBar：桌面悬浮联系和手机固定联系栏。
- WechatModal / ContactChoiceModal：微信和联系选择弹窗。

## 4. 商家端页面结构

- BusinessPage：商家合作页，包含功能、对比、套餐、流程、FAQ 和联系弹窗。
- MerchantLogin：Authing 托管登录入口，微信/支付宝暂为即将开放。
- AuthCallback：只负责 Authing 回调和商家权限验证。
- ProtectedRoute：保护后台路由，验证 Authing 登录态和 `/api/merchant/me`。
- MerchantDashboard：后台占位布局，显示商家资料和功能入口。

## 5. Authing 与 D1 相关文件

本轮视觉重构不得改写认证架构，以下文件只做审计保护：

- `src/lib/authing.js`：唯一 Authing 实例和 `loginWithAuthingRedirect`。
- `src/context/AuthContext.jsx`：登录态恢复、用户信息、商家权限辅助验证。
- `src/components/auth/ProtectedRoute.jsx`：后台路由保护。
- `src/pages/AuthCallback.jsx`：Authing 回调处理。
- `functions/api/merchant/me.js`：Cloudflare Function，使用 jose 验证 Authing JWT，再查询 D1 `merchant_users`。

## 6. 当前图片、图标和字体资源

图片集中在 `public/images`：

- `hero-desktop.webp`、`hero-mobile.webp`、`hero-room.jpg`
- `room-garden-800.webp`、`room-twin-800.webp`、`room-family-800.webp`
- `family-bg.webp`、`family-room.jpg`、`twin-room.jpg`
- `wechat-qr-demo.png`

图标来自 `lucide-react`。字体为系统中文字体栈，无外部字体依赖。

## 7. 重复组件、重复 CSS 和废弃代码

- `src/App.jsx` 体量较大，顾客端、商家合作端和多个弹窗都集中在同一文件，后续可拆分，但第一阶段先避免大范围迁移。
- `src/styles.css` 超过 3300 行，包含顾客端、商家合作端、商家登录和后台样式，存在历史迭代痕迹。
- 现有房型、问答、弹窗和联系逻辑仍被使用，不应删除。
- 可在视觉重构后清理旧首页选择器，但本阶段优先保证业务功能不被破坏。

## 8. 现有移动端主要问题

- 首页仍偏“功能模块堆叠”，缺少精品民宿的故事节奏。
- 房型区是普通卡片网格，手机端浏览还可以，但缺少主推房型与空间层次。
- 昆明攻略卡片信息密度偏平，缺少旅行路线的时间线感。
- 智能问答功能完整，但视觉上仍像工具表单，需要包装成管家对话体验。
- 过多区域使用相似卡片样式，页面节奏和层次不够鲜明。

## 9. 可以保留的业务功能

- 房型数据、价格、设施、详情弹窗和轮播。
- 关键词问答、快捷问题、输入咨询和管家回复按钮。
- 昆明路线与交通数据。
- 电话、微信、导航、二维码、复制微信号。
- 手机固定联系栏与桌面悬浮联系按钮。
- 商家合作页和商家登录入口。
- Authing 登录、回调、ProtectedRoute 和 D1 权限验证。

## 10. 需要重构的视觉模块

- 顾客端全局导航。
- 首屏 Hero。
- 品牌定位与民宿空间叙事。
- 房型展示。
- AI 智能管家模块。
- 昆明旅行路线和交通信息。
- 适合人群与住宿场景。
- FAQ 与预订行动区。
- 完整页脚与商家合作入口。
- 商家登录页只做视觉统一，不改认证流程。
