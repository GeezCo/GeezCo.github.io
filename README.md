# Wincy Blog Template

一个基于 Astro 的静态博客模板，支持一键部署到 Vercel。

**Live Demo**: [wincy-blog.vercel.app](https://wincy-blog.vercel.app)

## 特性

- ⚡ **极速加载** - Astro 零 JS 默认策略，首屏性能 95+
- 🌙 **夜间模式** - 自动检测系统偏好，手动切换持久化
- 📝 **Markdown 写作** - Obsidian / VS Code 直接编辑
- 🔍 **站内搜索** - Pagefind 全文搜索
- 💬 **评论系统** - Giscus（GitHub Discussions）
- 📊 **访问统计** - Umami（隐私友好）
- 🎨 **一键换色** - 7 种配色预设，改一行代码切换
- 📋 **代码复制** - 文章代码块一键复制按钮
- 🔒 **简历保护** - About 页面简历 PDF 密码验证下载
- ☕ **赞赏模块** - 文章底部简洁赞赏卡片
- 📱 **响应式设计** - 移动端完美适配

## 快速开始

### 1. Fork 本仓库

点击 GitHub 页面右上角 `Fork` 按钮。

### 2. 克隆到本地

```bash
git clone https://github.com/YOUR_USERNAME/wincy-blog.git
cd wincy-blog
```

### 3. 安装依赖

```bash
npm install
```

### 4. 本地预览

```bash
npm run dev
```

访问 `http://localhost:4321` 查看效果。

### 5. 写文章

在 `src/content/blog/` 目录创建 Markdown 文件：

```markdown
---
title: 我的第一篇文章
description: 文章简介
pubDate: 2026-05-21
tags: [技术, 笔记]
---

文章内容...
```

### 6. 构建部署

```bash
npm run build   # 构建静态文件
npm run preview # 本地预览构建结果
```

## 部署到 Vercel

1. 登录 [Vercel](https://vercel.com)
2. 点击 `New Project` → Import 你 Fork 的仓库
3. Framework 选择 `Astro`
4. 点击 `Deploy`

完成后 Vercel 会分配一个域名，每次 push 自动部署。

## 自定义配置

### 站点信息

编辑 `src/site.config.ts`：

```ts
export const site = {
  title: "你的博客名称",
  description: "博客简介",
  author: "你的名字",
};
```

### 主题配色

编辑 `src/theme.config.ts`：

```ts
// 可选：indigo, green, red, orange, blue, pink, dark
export const currentTheme = themePresets.green;
```

### 评论系统

1. 在你的 GitHub 仓库启用 Discussions
2. 访问 [giscus.app](https://giscus.app/zh-CN) 获取配置
3. 更新 `src/components/Giscus.astro` 中的 `data-repo` 等参数

### 访问统计

1. 注册 [Umami Cloud](https://cloud.umami.is)（免费 100k events/月）
2. 创建网站获取 `website-id`
3. 更新 `src/components/Analytics.astro`

### 赞赏页面

1. 准备支付宝/微信收款码图片
2. 放入 `public/images/`
3. 更新 `src/pages/sponsor.astro` 图片路径

## 目录结构

```
blog/
├── src/
│   ├── content/blog/    ← 文章 Markdown 文件
│   ├── pages/           ← 页面（首页、关于、搜索等）
│   ├── layouts/         ← 布局模板
│   ├── components/      ← UI 组件（评论/赞赏/导航等）
│   ├── styles/          ← 全局样式
│   ├── site.config.ts   ← 站点配置
│   └── theme.config.ts  ← 主题配色
├── public/
│   └── images/          ← 图片资源
├── astro.config.mjs     ← Astro 配置
└── package.json
```

## 技术栈

| 技术 | 用途 |
|------|------|
| Astro 6 | 静态站点生成 |
| Tailwind CSS v4 | 样式系统 |
| Pagefind | 站内搜索 |
| Giscus | 评论系统 |
| Umami | 访问统计 |

## License

MIT - 自由使用和修改

## 致谢

基于 Astro 官方模板构建，感谢 Astro 团队和开源社区。