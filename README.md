# Astro 博客部署手册

**从 Obsidian 写作 → Git → Astro 站点 → Vercel 部署**

---

## 特性

- Tailwind CSS v4 现代样式
- 夜间模式切换
- Giscus 评论系统
- Pagefind 站内搜索
- Umami Analytics
- RSS + Sitemap

---

## 目录结构

```
Obsidian Vault/
│
├── BlogContent/              ← 写作目录（不进 Git）
│   └── *.md                  ← 文章源文件
│
└── blog/                     ← Astro 工程（推送到 GitHub）
    │
    ├── src/
    │   ├── content/blog/     ← sync 自动生成
    │   ├── pages/            ← 页面文件
    │   ├── layouts/          ← 布局模板
    │   ├── components/       ← 组件
    │   └── styles/           ← CSS
    │
    ├── scripts/              ← sync 脚本
    ├── public/images/        ← 图片目录
    └── theme.config.ts       ← 配色配置
```

---

## 工作流程

```
Obsidian 写文章
      ↓
npm run sync（文章 + 图片 → blog）
      ↓
git commit → push
      ↓
Vercel 自动构建部署
```

---

## 快速开始

### 环境要求

| 软件 | 版本 |
|-----|------|
| Node.js | ≥ 22.12.0 |
| Git | 任意 |
| GitHub | 账号 |
| Vercel | 账号 |

### 安装依赖

```bash
npm install
```

### 同步文章

```bash
npm run sync
```

### 构建

```bash
npm run build
```

### 本地预览

```bash
npm run preview
```

---

## 写作流程

每次写新文章：

1. Obsidian 创建文章
2. 添加 frontmatter：
   ```yaml
   ---
   type: Post
   status: Published
   date: 2026-05-21
   tags: [技术]
   summary: 简介
   ---
   ```
3. `npm run sync`
4. `git add . && git commit -m "新增文章"`
5. `git push`

---

## 配色切换

修改 `src/theme.config.ts`：

```ts
// 可选主题：indigo, green, red, orange, blue, pink, dark
export const currentTheme = themePresets.green;
```

---

## 夜间模式

点击导航栏 🌙/☀️ 按钮：
- 自动保存偏好
- 下次访问保持选择
- 支持系统偏好检测

---

## 第三方服务

### Giscus 评论

1. GitHub repo → Settings → Discussions → Enable
2. 访问 giscus.app 获取配置
3. 更新 `src/components/Giscus.astro`

### Umami Analytics

1. 注册 cloud.umami.is
2. 获取 website-id
3. 更新 `src/components/Analytics.astro`

### 赞赏页面

1. 放置收款码到 `public/images/`
2. 更新 `src/pages/sponsor.astro`

---

## Vercel 配置

| 配置项 | 值 |
|-----|-----|
| Framework | Astro |
| Build Command | `npm run build` |
| Output | `dist` |
| Env `SITE_URL` | 你的 Production URL |

---

## 常见问题

| 问题 | 解决 |
|-----|-----|
| 代码块样式异常 | 检查 global.css |
| 夜间模式无效 | 检查 ThemeToggle |
| 图片不显示 | 重新 npm run sync |
| RSS URL 错误 | 用 VERCEL_PROJECT_PRODUCTION_URL |

---

## License

MIT