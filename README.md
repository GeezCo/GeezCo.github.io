# GeezCo

个人技术门户 + 智能文档处理平台，单一仓库（monorepo）管理。

🔗 **在线访问**: [https://geezco.github.io](https://geezco.github.io)

## 仓库结构

```
.
├── site/          # 门户网站（Astro 6 静态站）→ 部署到 GitHub Pages
├── backend/       # GzDoc 后端（Java / Spring Cloud 微服务）
├── frontend/      # GzDoc 前端（React + TypeScript + Ant Design）
├── ai-service/    # GzDoc AI 服务（Python / FastAPI / RAG）
├── infrastructure/# Docker 等部署基础设施
├── docs/          # GzDoc 项目内部文档
└── .trellis/      # 任务 / 规范工作流
```

## 两大组成部分

### 1. 门户网站（`site/`）— 主站

基于 Astro 6 构建的静态站点，部署在 GitHub Pages。

- 📝 技术博客（支持文章加密、草稿）
- 📚 文档中心
- 🛠️ 在线工具箱（Mermaid、SVG 转换、ASCII Art）
- 🔍 Pagefind 全文搜索
- 🌙 夜间模式 / 💬 Giscus 评论 / 📊 Umami 统计

**本地开发与发布：**
```bash
cd site
npm install
npm run dev      # http://localhost:4321
npm run build    # 构建 + 生成 Pagefind 搜索索引

# 写文章：在 site/src/content/blog/ 新建 .md 后
git add . && git commit -m "post: 新文章" && git push   # push main 自动部署
```
详见 [`site/README.md`](site/README.md)。

### 2. GzDoc 平台（`backend/` `frontend/` `ai-service/`）

企业级智能文档处理平台，"平台+插件"架构。

- 文档管理、OCR、向量化（Weaviate）
- 基于 RAG 的智能问答
- 多租户、JWT 认证、RBAC 权限

**技术栈**：Spring Boot 3.2 + Spring Cloud · React 18 + TS · FastAPI + LangChain
详见 [`docs/`](docs/) 与各模块 README。

## 部署

| 组成部分 | 部署方式 |
|----------|----------|
| 门户网站 | push 到 `main` 且改动 `site/` → GitHub Actions 自动构建并发布 Pages |
| GzDoc 平台 | 打 `v*` tag → `docker-deploy.yml` 构建推送镜像；或 `scripts/deploy.sh` |

## 许可证

[MIT License](LICENSE)
