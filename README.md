# Wincy Blog

基于 Astro 6 的静态技术博客，部署在 GitHub Pages。

**[processmonitor.github.io](https://processmonitor.github.io)**

## 特性

- **极速加载** — Astro 静态生成，零 JS 默认策略
- **夜间模式** — 自动检测系统偏好，手动切换持久化
- **Markdown 写作** — 在 `src/content/blog/` 直接写 .md
- **文章加密** — 构建时 AES-256-GCM 加密正文，客户端密码解锁
- **站内搜索** — Pagefind 全文搜索
- **评论系统** — Giscus（GitHub Discussions）
- **访问统计** — Umami（隐私友好）
- **简历保护** — 密码验证下载，阿里云函数计算 API
- **代码复制** — 代码块一键复制
- **工具箱** — Mermaid 在线转图片
- **赞赏模块** — 文章底部简洁赞赏卡片
- **响应式设计** — 移动端完美适配

## 快速开始

```bash
git clone git@github.com:ProcessMonitor/wincy-blog.git
cd wincy-blog
npm install
npm run dev       # http://localhost:4321
```

## 写文章

在 `src/content/blog/` 创建 `.md` 文件：

```markdown
---
title: 我的第一篇文章
description: 文章简介
pubDate: 2026-05-25
tags: [技术, 笔记]
---

正文...
```

### 加密文章

```markdown
---
title: 私密文章
description: 需要密码查看
pubDate: 2026-05-25
locked: true
password: 你的密码
---

加密内容...
```

加密文章在首页显示锁图标，点击后输入密码才能查看正文。

## frontmatter 字段

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | string | 是 | 标题 |
| description | string | 否 | 摘要 |
| pubDate | date | 是 | 发布日期 |
| updatedDate | date | 否 | 更新日期 |
| tags | string[] | 否 | 标签 |
| draft | boolean | 否 | 草稿（不发布） |
| locked | boolean | 否 | 加密（需 password） |
| password | string | 否 | 加密密码 |

## 命令

```bash
npm run dev       # 开发服务器
npm run build     # 构建（astro + pagefind）
npm run preview   # 预览构建结果
```

## 部署

GitHub Actions 自动部署到 GitHub Pages。push 到 `main` 分支即可触发。

配置文件：`.github/workflows/deploy.yml`

## 技术栈

| 技术 | 用途 |
|------|------|
| Astro 6 | 静态站点生成 |
| Tailwind CSS v4 | 样式 |
| Pagefind | 站内搜索 |
| Giscus | 评论 |
| Umami | 访问统计 |
| marked | 构建时 Markdown→HTML（加密文章） |
| AES-256-GCM + PBKDF2 | 文章加密（node:crypto + Web Crypto API） |
| 阿里云 FC | 简历 API（密码验证 + PDF 下载） |
| GitHub Pages | 静态托管 |

## License

MIT