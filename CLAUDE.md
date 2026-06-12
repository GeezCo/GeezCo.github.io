# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GeezCo 是基于 Astro 6 构建的技术分享与开源项目门户，部署在 GitHub Pages。

**核心特性**：
- 技术博客系统（支持文章加密）
- 文档中心（多系统文档管理）
- 在线工具箱（Mermaid、SVG 转换、ASCII Art）
- Pagefind 全文搜索
- Giscus 评论系统
- 夜间模式

**技术栈**：Astro 6 + Tailwind CSS v4 + Pagefind + bob-wasm（加密）

## Development Commands

```bash
# 开发
npm run dev              # 启动开发服务器 (http://localhost:4321)

# 构建
npm run build            # 构建生产版本 + 生成 Pagefind 搜索索引
npm run preview          # 预览构建结果

# 测试构建（验证更改）
npm run build && npm run preview
```

**注意**：`npm run build` 会自动运行 `pagefind --site dist` 生成搜索索引，这是部署前的必要步骤。

## Architecture

### Content Collections

**博客文章** (`src/content/blog/*.md`)：
- Schema 定义在 `src/content.config.ts`
- 支持加密文章（`locked: true` + `password` 字段）
- 加密使用 AES-256-GCM + PBKDF2（通过 bob-wasm）
- 文章模板：`src/content/blog/_template.md`

**文档系统** (`src/content/docs/`)：
- 多系统文档支持（如 `gzDoc/`）
- 路由：`/doc/[system]/[...slug]`
- 布局：`DocLayout.astro`（包含侧边栏、面包屑、TOC、分页）

### Layouts

- `BaseLayout.astro` — 基础布局（Header、Footer、Analytics、Giscus）
- `PostLayout.astro` — 博客文章布局（支持加密锁屏）
- `DocLayout.astro` — 文档布局（侧边栏、TOC、面包屑、分页）

### Components

**关键组件**：
- `LockScreen.astro` — 文章加密解锁界面（bob-wasm 解密）
- `SearchModal.astro` — Pagefind 搜索模态框
- `DocSidebar.astro` / `DocTOC.astro` — 文档导航
- `ThemeToggle.astro` — 夜间模式切换
- `Giscus.astro` — GitHub Discussions 评论

### Tools System

**工具配置**：`src/data/tools/*.json`
- 每个工具一个独立 JSON 文件（避免合并冲突）
- 工具页面：`src/pages/tools/*.astro`
- 工具列表页自动聚合所有 JSON 配置

**添加新工具**：
1. 创建 `src/data/tools/my-tool.json`：
   ```json
   {
     "name": "工具名",
     "icon": "🔧",
     "description": "简短描述",
     "url": "/tools/my-tool",
     "color": "from-blue-500 to-cyan-500"
   }
   ```
2. 创建 `src/pages/tools/my-tool.astro`
3. 工具会自动显示在 `/tools` 页面

**可用渐变色**：`from-blue-500 to-cyan-500` / `from-purple-500 to-pink-500` / `from-green-500 to-emerald-500` / `from-orange-500 to-red-500` / `from-yellow-500 to-amber-500` / `from-indigo-500 to-violet-500`

## Styling

- **Tailwind CSS v4**（使用 `@tailwindcss/postcss`）
- 夜间模式：通过 `html.dark` 类切换（`:global(html.dark)` 选择器）
- 全局样式：`src/styles/global.css`
- 组件样式：Astro 组件内 `<style>` 标签（scoped）

## Deployment

- **平台**：GitHub Pages
- **触发**：推送到 `main` 分支
- **CI/CD**：GitHub Actions 自动构建和部署
- **站点配置**：`astro.config.mjs` 中 `site: 'https://geezco.github.io'`

## Trellis Workflow System

项目使用 Trellis 工作流系统管理开发任务（`.trellis/` 目录）。

**核心命令**：
```bash
# 初始化开发者身份（首次使用）
python3 ./.trellis/scripts/init_developer.py <your-name>

# 任务管理
python3 ./.trellis/scripts/task.py create "<title>"    # 创建任务
python3 ./.trellis/scripts/task.py start <name>        # 开始任务
python3 ./.trellis/scripts/task.py current             # 查看当前任务
python3 ./.trellis/scripts/task.py finish              # 完成任务
python3 ./.trellis/scripts/task.py list                # 列出所有任务
python3 ./.trellis/scripts/task.py archive <name>      # 归档任务

# 获取上下文
python3 ./.trellis/scripts/get_context.py              # 完整会话运行时
python3 ./.trellis/scripts/get_context.py --mode packages  # 可用包和规范层
```

**工作流原则**：
1. 先规划后编码
2. 规范通过 hook/skill 注入，不依赖记忆
3. 持久化所有内容（研究、决策、经验教训）
4. 增量开发（一次一个任务）
5. 捕获学习成果（任务后回顾并更新规范）

**目录结构**：
- `.trellis/spec/` — 编码规范和指南
- `.trellis/tasks/` — 任务目录（每个任务一个子目录）
- `.trellis/workspace/<developer>/` — 开发者工作空间和会话日志
- `.trellis/workflow.md` — 完整工作流文档

## Important Notes

- **Node 版本**：需要 Node.js >= 22
- **搜索索引**：修改文章后需重新构建以更新 Pagefind 索引
- **加密文章**：密码存储在 frontmatter 中，仅用于客户端解密（不是真正的安全保护）
- **API 目录**：`api/` 包含阿里云函数计算 API（简历下载功能）
- **Git 状态**：当前分支 `main`，有未提交的更改（`public/favicon.png` 已修改）