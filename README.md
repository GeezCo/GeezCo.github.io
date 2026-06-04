# GeezCo

GeezCo 技术分享与开源项目门户，基于 Astro 6 构建的静态站点。

🔗 **在线访问**: [https://geezco.github.io](https://geezco.github.io)

## 特性

- 📝 技术文章分享，支持文章加密
- 🔍 Pagefind 全文搜索
- 🌙 夜间模式
- 💬 Giscus 评论系统
- 📊 Umami 访问统计
- 🛠️ 在线工具箱（Mermaid、SVG 转换、ASCII Art）
- 🔒 简历密码保护下载

## 快速开始

```bash
git clone git@github.com:GeezCo/GeezCo.github.io.git
cd GeezCo.github.io
npm install
npm run dev        # http://localhost:4321
```

## 命令

```bash
npm run dev       # 启动开发服务器
npm run build     # 构建生产版本
npm run preview   # 预览构建结果
```

## 技术栈

- **框架**: Astro 6
- **样式**: Tailwind CSS v4
- **搜索**: Pagefind
- **评论**: Giscus (GitHub Discussions)
- **统计**: Umami
- **加密**: AES-256-GCM + PBKDF2
- **部署**: GitHub Pages + GitHub Actions

## 项目结构

```
src/
├── content/blog/        # Markdown 文章
├── pages/               # 路由页面
├── layouts/             # 布局组件
├── components/          # 可复用组件
└── styles/              # 全局样式

api/                     # 阿里云函数计算 API（简历下载）
```

## 写作

在 `src/content/blog/` 目录下创建 `.md` 文件：

```markdown
---
title: 文章标题
description: 简短摘要
pubDate: 2026-05-27
tags: [标签1, 标签2]
---

正文内容...
```

### 加密文章

```markdown
---
title: 私密文章
pubDate: 2026-05-27
locked: true
password: 你的密码
---

加密内容...
```

## 部署

推送到 `main` 分支后，GitHub Actions 会自动构建并部署到 GitHub Pages。

## 贡献指南

### 如何添加新工具

欢迎贡献新的在线工具！只需 2 步：

**1. 创建工具配置文件**

在 `src/data/tools/` 目录下创建新的 JSON 文件（如 `my-tool.json`）：

```json
{
  "name": "我的工具",
  "icon": "🔧",
  "description": "工具的简短描述",
  "url": "/tools/my-tool",
  "color": "from-orange-500 to-red-500"
}
```

**可用的渐变色：**
- `from-blue-500 to-cyan-500` （蓝色）
- `from-purple-500 to-pink-500` （紫色）
- `from-green-500 to-emerald-500` （绿色）
- `from-orange-500 to-red-500` （橙红色）
- `from-yellow-500 to-amber-500` （黄色）
- `from-indigo-500 to-violet-500` （靛紫色）

**2. 创建工具页面**

在 `src/pages/tools/` 目录下创建工具页面（如 `my-tool.astro`）。

**3. 提交 PR**

提交 Pull Request，工具会自动显示在工具列表页面。

### 为什么使用独立 JSON 文件？

- ✅ **避免合并冲突**：每个贡献者只添加自己的 JSON 文件
- ✅ **独立维护**：每个工具的配置独立管理
- ✅ **自动聚合**：构建时自动读取所有工具配置

## 许可

MIT License
