---
title: 工作区使用指南
description: 单一仓库（monorepo）下的开发工作区与目录结构说明
order: 6
---

## 目录结构

本仓库为 monorepo，门户网站与 GzDoc 平台放在同一个 Git 仓库里：

```
GeezCo.github.io/
├── site/            # 门户网站（Astro 6）→ GitHub Pages
│   ├── src/
│   │   ├── content/blog/      # 博客文章（.md）
│   │   ├── content/docs/      # 文档中心
│   │   └── pages/             # 路由页面
│   └── package.json
├── backend/         # GzDoc 后端（Java / Spring Cloud）
│   ├── gzdoc-common/
│   ├── gzdoc-gateway/
│   ├── gzdoc-auth/
│   ├── gzdoc-document/
│   └── gzdoc-qa/
├── frontend/        # GzDoc 前端（React + TS）
├── ai-service/      # GzDoc AI 服务（Python）
├── infrastructure/  # Docker / 部署配置
├── docs/            # 项目内部文档
└── .trellis/        # 任务 / 规范工作流
```

## 工作区隔离建议

### 方案1：VS Code 工作区（推荐）

```bash
cd GeezCo.github.io
code gzdoc.code-workspace      # 打开完整工作区
code site/                     # 只开发网站
code backend/                  # 只开发后端
code frontend/                 # 只开发前端
```

### 方案2：终端分屏（tmux）

```bash
tmux new -s gzdoc
# Ctrl+b %  垂直分屏    Ctrl+b "  水平分屏    Ctrl+b o  切换
```

## 日常工作流

### 写文章 / 改网站

```bash
cd site
npm run dev        # http://localhost:4321 预览
# 编辑 site/src/content/blog/ 下的 .md
git add . && git commit -m "post: 新文章" && git push
```

### 开发后端 / AI / 前端

```bash
# 后端
cd backend && mvn spring-boot:run
# AI 服务
cd ai-service && uvicorn app.main:app --reload
# 前端
cd frontend && npm run dev
```

## 为什么用单仓库（Monorepo）

1. **统一版本管理**：网站、后端、AI 一次提交，改动可追溯
2. **跨模块重构方便**：接口改动前后端一起改、一起提交
3. **部署清晰**：
   - 门户网站：push `main` 且改动 `site/` → 自动发布 Pages
   - 平台代码：打 `v*` tag → 构建推送 Docker 镜像
4. **文档就位**：不需要跨仓库同步，公开文档放在 `site/` 里，内部文档放在 `docs/` 里

## 关键原则

1. 网站与平台代码各居其位（`site/` vs 其余目录），互不干扰
2. 只有 `site/` 的改动会触发网站部署，后端改动不会误触发
3. 保持结构简单，不引入不必要的复杂度
