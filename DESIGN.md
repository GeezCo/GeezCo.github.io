---
version: alpha
name: GeezCo-Design-System
description: GeezCo 门户网站设计系统 — 融合 Stripe 深蓝专业风格与 Vercel 多彩渐变装饰，打造现代开发者平台视觉语言

colors:
  # 主色系 (Stripe 电光靛蓝)
  primary: "#533afd"
  primary-deep: "#4434d4"
  primary-press: "#2e2b8c"
  primary-soft: "#665efd"
  
  # 墨色系 (Stripe 深蓝墨色)
  ink: "#0d253d"
  ink-secondary: "#273951"
  ink-mute: "#64748d"
  
  # 画布系 (近白/柔白)
  canvas: "#ffffff"
  canvas-soft: "#f6f9fc"
  canvas-soft-2: "#f0f4f8"
  
  # 边框系
  hairline: "#e3e8ee"
  hairline-strong: "#a8c3de"
  
  # 渐变系 (Vercel 多彩渐变)
  gradient-cyan: "#50e3c2"
  gradient-blue-start: "#007cf0"
  gradient-blue-end: "#00dfd8"
  gradient-magenta: "#ff0080"
  gradient-amber: "#f9cb28"
  
  # 语义色
  success: "#22c55e"
  error: "#ef4444"
  warning: "#f59e0b"
  
  # 暗色模式
  dark-bg: "#0a1628"
  dark-bg-soft: "#0f1f35"
  dark-surface: "#1a2942"
  dark-border: "#2d3f5f"
  dark-text: "#e2e8f0"
  dark-text-muted: "#94a3b8"

typography:
  # Display 层级 (Stripe 细体风格)
  display-xxl:
    fontFamily: "'SF Pro Display', system-ui, -apple-system, 'PingFang SC', sans-serif"
    fontSize: 56px
    fontWeight: 300
    lineHeight: 1.03
    letterSpacing: -1.4px
  
  display-xl:
    fontFamily: "'SF Pro Display', system-ui, -apple-system, 'PingFang SC', sans-serif"
    fontSize: 48px
    fontWeight: 300
    lineHeight: 1.15
    letterSpacing: -0.96px
  
  display-lg:
    fontFamily: "'SF Pro Display', system-ui, -apple-system, 'PingFang SC', sans-serif"
    fontSize: 32px
    fontWeight: 300
    lineHeight: 1.1
    letterSpacing: -0.64px
  
  display-md:
    fontFamily: "'SF Pro Display', system-ui, -apple-system, 'PingFang SC', sans-serif"
    fontSize: 26px
    fontWeight: 300
    lineHeight: 1.12
    letterSpacing: -0.26px
  
  # Heading 层级
  heading-lg:
    fontFamily: "'SF Pro Display', system-ui, -apple-system, 'PingFang SC', sans-serif"
    fontSize: 22px
    fontWeight: 400
    lineHeight: 1.3
    letterSpacing: -0.22px
  
  heading-md:
    fontFamily: "'SF Pro Display', system-ui, -apple-system, 'PingFang SC', sans-serif"
    fontSize: 20px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: -0.2px
  
  # Body 层级
  body-lg:
    fontFamily: "'SF Pro Display', system-ui, -apple-system, 'PingFang SC', sans-serif"
    fontSize: 18px
    fontWeight: 300
    lineHeight: 1.6
    letterSpacing: 0
  
  body-md:
    fontFamily: "'SF Pro Display', system-ui, -apple-system, 'PingFang SC', sans-serif"
    fontSize: 15px
    fontWeight: 300
    lineHeight: 1.6
    letterSpacing: 0
  
  body-sm:
    fontFamily: "'SF Pro Display', system-ui, -apple-system, 'PingFang SC', sans-serif"
    fontSize: 14px
    fontWeight: 300
    lineHeight: 1.5
    letterSpacing: 0
  
  # Button 层级
  button-md:
    fontFamily: "'SF Pro Display', system-ui, -apple-system, 'PingFang SC', sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.0
    letterSpacing: 0
  
  button-sm:
    fontFamily: "'SF Pro Display', system-ui, -apple-system, 'PingFang SC', sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.0
    letterSpacing: 0
  
  # Caption 层级
  caption:
    fontFamily: "'SF Pro Display', system-ui, -apple-system, 'PingFang SC', sans-serif"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0

rounded:
  xs: 4px
  sm: 6px
  md: 8px
  lg: 12px
  xl: 16px
  pill: 9999px

spacing:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  xxl: 32px
  huge: 64px
  section: 96px

components:
  # 按钮组件
  button-primary-pill:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.canvas}"
    typography: "{typography.button-md}"
    rounded: "{rounded.pill}"
    padding: "12px 24px"
  
  button-secondary-pill:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.primary}"
    typography: "{typography.button-md}"
    rounded: "{rounded.pill}"
    padding: "12px 24px"
    border: "1px solid {colors.primary}"
  
  # 卡片组件
  card-feature:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    padding: "{spacing.xxl}"
    border: "1px solid {colors.hairline}"
  
  card-section:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.xl}"
    padding: "{spacing.xxl}"
  
  # 导航组件
  nav-bar:
    backgroundColor: "rgba(255, 255, 255, 0.8)"
    backdropFilter: "blur(12px)"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    height: "64px"
    borderBottom: "1px solid {colors.hairline}"
  
  nav-link:
    textColor: "{colors.ink-mute}"
    typography: "{typography.body-sm}"
    padding: "8px 12px"
  
  # 文档侧边栏
  doc-sidebar:
    backgroundColor: "{colors.canvas-soft}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    borderRight: "1px solid {colors.hairline}"
  
  doc-nav-item:
    textColor: "{colors.ink-secondary}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.sm}"
    padding: "8px 12px"
  
  doc-nav-item-active:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.canvas}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.sm}"
    padding: "8px 12px"
  
  doc-nav-item-hover:
    backgroundColor: "{colors.canvas-soft-2}"
    textColor: "{colors.ink}"
  
  # Hero 区域
  hero-gradient-mesh:
    description: "Vercel 风格多彩渐变网格，占据 Hero 上半部分"
    gradient: "linear-gradient(135deg, {colors.gradient-cyan} 0%, {colors.gradient-blue-start} 25%, {colors.gradient-magenta} 50%, {colors.gradient-amber} 100%)"
    opacity: 0.15
    blur: 80px

---

## 概述

GeezCo 设计系统融合了 Stripe 的深蓝专业风格与 Vercel 的多彩渐变装饰，打造现代开发者平台的视觉语言。

**核心特征：**
- **Stripe 电光靛蓝** (#533afd) 作为主色，传递专业与创新
- **Vercel 多彩渐变网格** 作为 Hero 区域装饰，增添活力
- **Stripe 细体字体风格** (300 字重 + 负字距) 营造轻盈优雅的阅读体验
- **深蓝墨色** (#0d253d) 作为主要文本色，确保可读性
- **近白画布** (#ffffff / #f6f9fc) 作为背景，保持清爽

## 配色方案

### 主色系
- **Primary** (#533afd): 主要 CTA 按钮、链接、强调元素
- **Primary Deep** (#4434d4): 悬停状态
- **Primary Press** (#2e2b8c): 按下状态

### 墨色系
- **Ink** (#0d253d): 主要文本色
- **Ink Secondary** (#273951): 次要文本
- **Ink Mute** (#64748d): 辅助文本、标签

### 画布系
- **Canvas** (#ffffff): 卡片、对话框背景
- **Canvas Soft** (#f6f9fc): 页面背景、侧边栏
- **Canvas Soft 2** (#f0f4f8): 悬停状态背景

### 渐变系 (Vercel 风格)
用于 Hero 区域装饰性渐变网格：
- Cyan (#50e3c2) → Blue (#007cf0) → Magenta (#ff0080) → Amber (#f9cb28)

### 暗色模式
- **Dark BG** (#0a1628): 主背景
- **Dark Surface** (#1a2942): 卡片背景
- **Dark Border** (#2d3f5f): 边框
- **Dark Text** (#e2e8f0): 主文本

## 字体系统

### 字体栈
使用系统字体栈模拟 Stripe Sohne 效果：
```
'SF Pro Display', system-ui, -apple-system, 'PingFang SC', sans-serif
```

### 层级原则
- **Display 层级**: 300 字重 + 负字距 (-1.4px 到 -0.26px)
- **Body 层级**: 300 字重 + 零字距
- **Button 层级**: 400 字重 + 零字距

### 关键尺寸
- Display XL: 48px / 300 / -0.96px (Hero 标题)
- Display LG: 32px / 300 / -0.64px (章节标题)
- Body MD: 15px / 300 / 0 (正文)
- Button MD: 16px / 400 / 0 (按钮)

## 圆角系统

- **xs** (4px): 小标签
- **sm** (6px): 表单输入
- **md** (8px): 小卡片
- **lg** (12px): 标准卡片
- **xl** (16px): 大卡片
- **pill** (9999px): 按钮、标签

## 间距系统

基于 4px 基准单位：
- xs: 4px
- sm: 8px
- md: 12px
- lg: 16px
- xl: 24px
- xxl: 32px
- huge: 64px
- section: 96px

## 组件规范

### 按钮
- **Primary Pill**: 电光靛蓝背景 + 白色文字 + pill 圆角
- **Secondary Pill**: 白色背景 + 电光靛蓝文字 + 边框 + pill 圆角

### 卡片
- **Feature Card**: 白色背景 + 细边框 + 12px 圆角 + 32px 内边距
- **Section Card**: 白色背景 + 16px 圆角 + 32px 内边距

### 导航
- **Nav Bar**: 半透明白色 + 模糊效果 + 细边框
- **Nav Link**: 墨色文字 + 悬停变色

### 文档侧边栏
- **Sidebar**: 柔白背景 (#f6f9fc) + 细边框
- **Nav Item**: 次要墨色文字 + 悬停显示背景
- **Active Item**: 电光靛蓝背景 + 白色文字

## 设计原则

1. **细体为主**: Display 层级使用 300 字重，营造轻盈感
2. **负字距**: 标题使用负字距，增强视觉紧凑度
3. **渐变装饰**: Hero 区域使用 Vercel 多彩渐变，其他区域保持简洁
4. **深蓝专业**: 使用 Stripe 深蓝墨色作为主要文本色
5. **柔和背景**: 使用近白色背景，避免纯白刺眼

## 响应式断点

- **Mobile**: < 768px
- **Tablet**: 768px - 1023px
- **Desktop**: ≥ 1024px

## 暗色模式策略

- 背景从近白切换到深蓝黑 (#0a1628)
- 文本从深蓝墨色切换到浅灰 (#e2e8f0)
- 主色保持电光靛蓝，但调整透明度和亮度
- 边框从浅灰切换到深蓝灰 (#2d3f5f)
