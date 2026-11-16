# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 仓库概览（Monorepo）

本仓库是单一 Git 仓库（monorepo），包含两大部分：

| 目录 | 内容 | 部署 |
|------|------|------|
| `site/` | 门户网站（Astro 6 静态站）| GitHub Pages，push 改动 `site/` 自动发布 |
| `backend/` | GzDoc 后端（Java / Spring Cloud 微服务）| 打 tag → Docker 镜像 |
| `frontend/` | GzDoc 前端（React + TS + Ant Design）| 同上 |
| `ai-service/` | GzDoc AI 服务（Python / FastAPI / RAG）| 同上 |
| `infrastructure/` | Docker / 部署配置 | — |
| `docs/` | GzDoc 项目内部文档 | 不发布 |
| `.trellis/` | 任务 / 规范工作流 | — |

> 门户网站的开发命令、目录、组件细节都在 **`site/`** 下，本文档「Astro 网站」部分均相对 `site/`。

## Astro 门户网站（`site/`）

### 概览
基于 Astro 6，部署在 GitHub Pages。
- 技术博客（支持文章加密）
- 文档中心（多系统文档）
- 在线工具箱（Mermaid、SVG 转换、ASCII Art）
- Pagefind 全文搜索 / Giscus 评论 / 夜间模式

**技术栈**：Astro 6 + Tailwind CSS v4 + Pagefind + bob-wasm（加密）

### Development Commands（在 `site/` 下执行）
```bash
cd site
npm run dev              # 开发服务器 http://localhost:4321
npm run build            # 构建 + 生成 Pagefind 搜索索引（部署前必需）
npm run preview          # 预览构建结果
```

**注意**：`npm run build` 会自动运行 `pagefind --site dist` 生成搜索索引。

### Architecture（均相对 `site/`）

**Content Collections**
- 博客：`src/content/blog/*.md`，Schema 在 `src/content.config.ts`
  - 支持加密：`locked: true` + `password`（AES-256-GCM + PBKDF2 / bob-wasm）
  - 模板：`src/content/blog/_template.md`
- 文档：`src/content/docs/`，多系统（如 `gzDoc/`），路由 `/doc/[system]/[...slug]`

**Layouts**：`BaseLayout.astro`（基础）/ `PostLayout.astro`（博客+加密锁屏）/ `DocLayout.astro`（文档侧边栏+目录）

**Components**：`LockScreen.astro`（加密解锁）、`SearchModal.astro`（Pagefind 搜索）、`DocSidebar.astro`/`DocTOC.astro`（文档导航）、`ThemeToggle.astro`、`Giscus.astro`

**Tools System**
- 配置：`src/data/tools/*.json`（每个工具一个 JSON）
- 页面：`src/pages/tools/*.astro`
- 添加新工具：① 建 `src/data/tools/my-tool.json` ② 建 `src/pages/tools/my-tool.astro` ③ 自动出现在 `/tools`
- 渐变色可用：`from-blue-500 to-cyan-500` / `from-purple-500 to-pink-500` / `from-green-500 to-emerald-500` 等

**Styling**：Tailwind CSS v4；夜间模式 `html.dark` 类；全局样式 `src/styles/global.css`

### Deployment（网站）
- 平台：GitHub Pages，站点 `https://geezco.github.io`
- 触发：push `main` **且改动 `site/`**（`deploy.yml` 有 paths 过滤）
- 配置：`site/astro.config.mjs` 的 `site` 字段

## GzDoc 平台（`backend/` `frontend/` `ai-service/`）

- 后端：Spring Boot 3.2 + Spring Cloud + MyBatis-Plus，见 `backend/README` 与各模块
- 前��：React 18 + TS + Vite + AntD，`cd frontend && npm run dev`
- AI：Python + FastAPI + Weaviate，`cd ai-service && uvicorn app.main:app --reload`
- 部署：打 `v*` tag → `docker-deploy.yml` 构建镜像；或 `scripts/deploy.sh`

## Trellis Workflow System

项目使用 Trellis 工作流系统管理开发任务（`.trellis/` 目录）。

**核心命令**：
```bash
python3 ./.trellis/scripts/task.py create "<title>"    # 创建任务
python3 ./.trellis/scripts/task.py start <name>        # 开始任务
python3 ./.trellis/scripts/task.py current             # 当前任务
python3 ./.trellis/scripts/task.py finish              # 完成任务
python3 ./.trellis/scripts/task.py list                # 列出任务
python3 ./.trellis/scripts/task.py archive <name>      # 归档任务
python3 ./.trellis/scripts/get_context.py              # 完整会话运行时上下文
```

**目录结构**：`.trellis/spec/`（规范）、`.trellis/tasks/`（任务）、`.trellis/workspace/<dev>/`（工作空间与会话日志）、`.trellis/workflow.md`（工作流全文）

## Important Notes

- **Node 版本**：需 Node.js >= 22
- **搜索索引**：修改文章后需重新构建以更新 Pagefind 索引
- **加密文章**：密码存于 frontmatter，仅客户端解密，不是真正的安全保护
- **网站 API**：`site/api/`（阿里云函数计算，简历下载）
- **双标题**：公开文档正文不要写 `# 标题`，标题由 frontmatter `title` 渲染
