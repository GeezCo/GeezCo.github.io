# brainstorm: 文档系统完整实现

## Goal

实现完整的文档系统，支持多个系统的文档展示，包括文档详情页、侧边栏导航和搜索功能。将 `/doc` 从当前的空状态页面升级为功能完整的文档中心。

## What I already know

**用户需求（来自用户消息）：**
1. 开发具体系统的文档内容
2. 实现文档详情页 `/doc/[system]`
3. 添加文档侧边栏导航
4. 考虑添加文档搜索功能

**当前代码库状态：**
- 已有基础文档目录结构：`src/content/docs/README.md`
- 已有文档首页：`src/pages/doc/index.astro`（当前显示空状态）
- 已有博客系统作为参考：使用 markdown 文件，通过 Astro 的文件路由
- 已有 PostLayout 布局可作为文档布局参考
- 已有搜索功能（针对博客），可扩展到文档
- 项目使用 Astro 6 静态站点生成
- 没有使用 Astro Content Collections（博客文章直接通过 `Astro.glob()` 读取）

**技术约束：**
- Astro 6 静态站点
- 不使用 Vercel（部署到 GitHub Pages）
- 已有的样式系统：Tailwind CSS v4 + 暗色模式支持
- 已有的搜索实现：基于前端 JavaScript 的全文搜索

## Assumptions (temporary)

- 文档系统将采用类似博客的 markdown 文件结构
- 每个系统的文档放在 `src/content/docs/{system-name}/` 目录下
- 文档详情页路由为 `/doc/{system}/{doc-slug}`
- 侧边栏导航需要显示当前系统的所有文档，支持层级结构
- 文档搜索可以复用或扩展现有的博客搜索功能

## Open Questions

**MVP 范围边界：**
- 第一个文档系统的内容是什么？（需要用户提供具体系统名称和文档内容）
- 文档是否需要版本管理？（如 v1.0, v2.0）
- 文档是否需要多语言支持？

**侧边栏导航设计：**
- 侧边栏是否需要支持多级嵌套？（如：章节 > 小节 > 文档）
- 侧边栏是否需要折叠/展开功能？
- 侧边栏是否需要显示当前阅读进度？

**搜索功能范围：**
- 搜索是否需要区分博客和文档？（统一搜索 vs 分开搜索）
- 搜索结果是否需要显示文档所属系统？
- 是否需要高级搜索功能？（如按系统筛选、按标签筛选）

## Requirements (evolving)

**基础功能：**
- 创建文档内容结构和示例文档
- 实现文档详情页 `/doc/[system]/[slug]`
- 实现文档列表页 `/doc/[system]`
- 添加文档侧边栏导航组件
- 更新 `/doc` 首页，显示所有文档系统

**文档元数据（frontmatter）：**
- title: 文档标题
- description: 文档描述
- order: 排序顺序
- pubDate: 发布日期
- category: 分类/章节（可选）

## Acceptance Criteria (evolving)

- [ ] 至少有一个完整的文档系统示例
- [ ] 文档详情页正确渲染 markdown 内容
- [ ] 侧边栏导航显示当前系统的所有文档
- [ ] 侧边栏高亮当前正在阅读的文档
- [ ] `/doc` 首页显示所有可用的文档系统
- [ ] 文档页面支持暗色模式
- [ ] 文档页面响应式布局（移动端友好）
- [ ] 构建成功，无错误

## Definition of Done

- 文档系统功能完整可用
- 代码符合项目现有风格和约定
- 所有页面在浅色/暗色模式下显示正常
- 移动端和桌面端布局正常
- 构建通过，无 TypeScript 错误
- 提交 commit 消息清晰

## Out of Scope (explicit)

- 文档版本管理（未来功能）
- 多语言支持（未来功能）
- 文档评论功能（未来功能）
- 文档贡献工作流（未来功能）
- API 文档自动生成（未来功能）

## Technical Notes

**相关文件：**
- `src/pages/doc/index.astro` - 文档首页（需要更新）
- `src/content/docs/README.md` - 文档说明
- `src/layouts/PostLayout.astro` - 可参考的布局
- `src/components/Header.astro` - 已有文档导航链接

**设计参考：**
- 博客系统的实现方式（markdown + 文件路由）
- PostLayout 的样式和结构
- 现有的搜索功能实现

**待研究：**
- 文档系统的最佳实践（侧边栏导航、层级结构）
- Astro 动态路由的实现方式（`[system]` 和 `[slug]` 参数）
- 如何组织文档的目录结构以支持侧边栏导航
