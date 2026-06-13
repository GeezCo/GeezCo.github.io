# redesign: GeezCo 门户网站视觉升级

## Goal

参考 awesome-design-md 项目中的科技类门户网站设计（Vercel、Linear、Stripe 等），重新设计 GeezCo 门户网站的视觉系统，提升品牌专业度和用户体验。

## What I already know

**用户需求：**
- 参考 awesome-design-md 项目中的科技门户设计
- 重新设计 GeezCo 门户网站
- 提升整体视觉质量和专业度

**当前网站状态：**
- 已有门户首页：Hero 区域 + 3 个板块卡片（博客、文档、工具）
- 已有博客系统、文档系统（空状态）、工具页面
- 使用 Tailwind CSS v4 + 暗色模式
- 当前配色：紫色主题（#6366f1）
- 字体：系统默认字体栈

**可参考的设计系统：**
- **Vercel**: 黑白极简 + 多彩渐变网格，Geist 字体，开发者平台风格
- **Linear**: 深黑背景（#010102）+ 淡紫蓝主色（#5e6ad2），软件工艺感
- **Stripe**: 深蓝墨色 + 电光靛蓝，大气渐变网格，金融基础设施风格
- **Supabase**: 开源数据库平台，绿色主题
- **Cursor/Warp**: AI 开发工具，暗色主题 + 渐变强调

**技术约束：**
- Astro 6 静态站点
- Tailwind CSS v4
- 需要支持暗色模式
- 响应式设计
- 不依赖外部字体服务（可使用系统字体或自托管）

## Assumptions (temporary)

- 设计升级将保持现有的页面结构（首页、博客、文档、工具）
- 需要创建一套完整的设计系统（颜色、字体、组件）
- 可能需要调整现有组件的样式
- 设计风格倾向于开发者/科技产品风格

## Design Decisions (Confirmed)

**设计风格：** Stripe 为主 + Vercel 彩色渐变
- 基础：Stripe 的深蓝专业风格
- 装饰：Vercel 的多彩渐变网格（Hero 区域背景）
- 品牌：使用 Stripe 的电光靛蓝作为主色

**配色方案：**
- 主色：Stripe 电光靛蓝 (#533afd)
- 背景：Stripe 深蓝墨色 (#0d253d) + 近白画布 (#ffffff)
- 渐变：Vercel 多彩渐变（cyan/blue/magenta/amber）用于 Hero 装饰
- 渐变实现：大气渐变网格占据 Hero 上半部分，从顶部向下淡出，叠加在深蓝背景上
- 暗色模式：基于 Stripe 的深色系统重新设计

**字体系统：** Stripe 风格（细体 + 负字距）
- 英文：系统字体栈模拟 Sohne 效果（SF Pro Display, system-ui, sans-serif）
- 中文：苹方 / 系统默认
- 字重：标题 300-600，正文 300-400
- 字距：标题使用负字距（-0.02em 到 -0.05em）

**Logo：**
- 使用现有 favicon.png（正方形）
- 位置：保持当前位置（导航栏左侧）
- 尺寸：保持原始比例

**实施策略：** 分阶段渐进升级
- 阶段 1：设计系统定义（DESIGN.md + CSS 变量）+ 首页 Hero + 导航栏
- 阶段 2：卡片组件 + 按钮 + 首页完整升级
- 阶段 3：博客列表页 + 文章详情页
- 阶段 4：文档页面 + 工具页面

## Requirements (evolving)

**阶段 1：设计系统定义 + 首页 Hero + 导航栏 + 文档页面**

1. **创建 DESIGN.md** — 基于 Stripe + Vercel 的设计系统
   - 配色方案：
     - Primary: #533afd (Stripe 电光靛蓝)
     - Ink: #0d253d (Stripe 深蓝墨色)
     - Canvas: #ffffff / #f6f9fc (近白/柔白)
     - 渐变：Vercel 多彩渐变（cyan #50e3c2 → blue #007cf0 → magenta #ff0080 → amber #f9cb28）
     - 语义色：success, error, warning
   
   - 字体系统（Stripe 风格）：
     - Display XXL: 56px / 300 / -1.4px
     - Display XL: 48px / 300 / -0.96px
     - Display LG: 32px / 300 / -0.64px
     - Body MD: 15px / 300 / 0
     - Button: 16px / 400 / 0
     - 字体栈：'SF Pro Display', system-ui, -apple-system, sans-serif
   
   - 圆角系统：xs(4px), sm(6px), md(8px), lg(12px), pill(9999px)
   - 间距系统：xs(4px), sm(8px), md(12px), lg(16px), xl(24px), xxl(32px), huge(64px)

2. **创建 CSS 变量系统** — 在 BaseLayout 或全局样式中定义
   - 颜色变量（浅色/暗色模式）
   - 字体变量
   - 间距变量
   - 圆角变量

3. **升级首页 Hero 区域**
   - 大气渐变网格背景（Vercel 多彩渐变 + Stripe 深蓝底色）
   - 标题使用 Display XL 样式（48px / 300 / 负字距）
   - 副标题使用 Body LG 样式
   - CTA 按钮使用 Stripe pill 样式（电光靛蓝 + 圆角 pill）

4. **升级导航栏**
   - 背景：半透明白色 + backdrop-filter blur
   - Logo：保持 favicon.png 位置和尺寸
   - 导航链接：使用 Body SM 样式
   - 搜索按钮：优化样式
   - 主题切换：保持功能

5. **重新设计文档系统架构**（扁平化导航，支持多系统扩展）
   
   **结构设计：**
   - `/doc` → 统一的文档阅读界面（不再是系统列表）
   - 左侧固定侧边栏：树形导航，显示所有系统的文档
     - 系统分组（可折叠）：gzDoc、系统 B、系统 C...
     - 每个系统下显示其文档列表
     - 支持多级嵌套（章节 > 文档）
   - 右侧内容区：显示当前选中的文档内容
   - 路由：`/doc/[system]/[...slug]` 或 `/doc` 默认显示欢迎页
   
   **样式设计（Stripe 风格）：**
   - 侧边栏：近白背景 (#f6f9fc) + 细边框
   - 导航项：hover 时显示淡蓝背景
   - 当前选中项：电光靛蓝背景 + 白色文字
   - 内容区：纯白背景，最大宽度 56rem
   - 标题使用 Display LG 样式（32px / 300 / -0.64px）
   - 正文使用 Body MD 样式（15px / 300）
   
   **扩展性考虑：**
   - 侧边栏支持动态加载多个系统
   - 系统配置集中管理（可在 frontmatter 或配置文件中定义）
   - 支持系统图标、描述、排序
   - 支持文档的 order 字段控制显示顺序

**阶段 2：卡片组件 + 按钮 + 首页完整升级**
- 升级三个板块卡片（博客、文档、工具）
- 统一按钮样式（primary pill / secondary）
- 优化最新文章列表卡片

**阶段 3：博客列表页 + 文章详情页**
- 博客列表页视觉升级
- 文章详情页布局优化
- 代码块样式优化

**阶段 4：工具页面**
- 工具页面优化

## Acceptance Criteria (evolving)

**阶段 1 验收标准：**
- [ ] DESIGN.md 文件创建完成，包含完整的设计 token
- [ ] CSS 变量系统定义完成（颜色、字体、间距、圆角）
- [ ] 首页 Hero 区域有 Vercel 风格的多彩渐变网格背景
- [ ] Hero 标题使用 Stripe 细体风格（300 字重 + 负字距）
- [ ] 导航栏视觉升级完成（半透明 + 模糊效果）
- [ ] Logo 正常显示（favicon.png）
- [ ] 文档系统重新设计完成：
  - [ ] 左侧固定侧边栏显示所有系统的文档树
  - [ ] 右侧内容区显示文档内容
  - [ ] 支持多系统扩展（gzDoc + 未来系统）
  - [ ] 侧边栏使用 Stripe 风格样式
  - [ ] 文档内容区使用 Stripe 字体样式
- [ ] 浅色模式显示正常
- [ ] 暗色模式显示正常（基于 Stripe 深色系统）
- [ ] 响应式布局正常（移动端 + 桌面端）
- [ ] 构建成功，无错误

**阶段 2-4 验收标准：**
- [ ] 所有卡片组件使用统一样式
- [ ] 按钮使用 Stripe pill 样式
- [ ] 博客列表页视觉升级完成
- [ ] 文章详情页优化完成
- [ ] 文档页面和工具页面升级完成
- [ ] 整体视觉风格统一、专业

## Definition of Done

- 设计系统文档完整
- 所有主要页面视觉升级完成
- 暗色模式优化完成
- 代码符合项目规范
- 构建通过
- 提交 commit 消息清晰

## Out of Scope (explicit)

- 动画效果（可作为未来增强）
- 复杂的交互效果
- 插图和图标系统（使用现有的 emoji 或简单图标）
- 多语言界面
- 可访问性深度优化（保持基本可访问性即可）

## Technical Notes

**相关文件：**
- `src/pages/index.astro` - 首页（需要重点升级）
- `src/components/Header.astro` - 导航栏
- `src/layouts/BaseLayout.astro` - 基础布局（定义 CSS 变量）
- `src/layouts/PostLayout.astro` - 文章布局
- `astro.config.mjs` - Astro 配置
- `public/favicon.png` - Logo 文件

**参考资源：**
- `/Users/adam/Documents/WebStormProject/awesome-design-md/design-md/stripe/DESIGN.md` — Stripe 完整设计系统
- `/Users/adam/Documents/WebStormProject/awesome-design-md/design-md/vercel/DESIGN.md` — Vercel 渐变系统

**关键设计 Token（来自 Stripe DESIGN.md）：**

颜色：
- primary: #533afd (电光靛蓝)
- primary-deep: #4434d4
- primary-press: #2e2b8c
- ink: #0d253d (深蓝墨色)
- ink-secondary: #273951
- ink-mute: #64748d
- canvas: #ffffff
- canvas-soft: #f6f9fc
- hairline: #e3e8ee

Vercel 渐变色：
- cyan: #50e3c2
- gradient-develop-start: #007cf0
- gradient-develop-end: #00dfd8
- gradient-preview-start: #7928ca
- gradient-preview-end: #ff0080
- gradient-ship-start: #ff4d4d
- gradient-ship-end: #f9cb28

字体（Stripe 风格）：
- Display XXL: 56px / 300 / line-height 1.03 / letter-spacing -1.4px
- Display XL: 48px / 300 / 1.15 / -0.96px
- Display LG: 32px / 300 / 1.1 / -0.64px
- Body MD: 15px / 300 / 1.4 / 0
- Button MD: 16px / 400 / 1.0 / 0

圆角：
- xs: 4px, sm: 6px, md: 8px, lg: 12px, pill: 9999px

间距：
- xs: 4px, sm: 8px, md: 12px, lg: 16px, xl: 24px, xxl: 32px, huge: 64px

**实现要点：**
1. 渐变网格使用 CSS linear-gradient + background-blend-mode
2. 字体使用系统字体栈：'SF Pro Display', system-ui, -apple-system, sans-serif
3. 暗色模式需要定义对应的深色变量
4. 使用 CSS 变量便于全局管理和主题切换
5. 响应式断点：mobile < 768px, tablet 768-1023px, desktop ≥ 1024px
