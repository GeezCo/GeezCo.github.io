# 实现专业文档系统布局

## Goal

实现类似 Vue/React/Claude Code 官方文档的专业布局：左侧目录导航 + 中间富文本内容区域。参考 docs.trytrellis.app 的设计风格。

## What I already know

### 当前实现
- 文档入口：`src/pages/doc/index.astro`（文档系统列表页）
- 文档内容：`src/content/docs/` 目录
- 当前有一个 gzDoc 系统文档（子模块）
- 目前只有列表页，没有实现文档阅读页面

### 目标布局
- **左侧**：固定侧边栏，显示文档目录树
- **中间**：主内容区域，显示 Markdown 渲染的富文本
- **右侧**（可选）：目录大纲（TOC）
- **响应式**：移动端侧边栏可折叠

### 参考站点
- Vue 文档：https://vuejs.org/guide/
- React 文档：https://react.dev/learn
- Claude Code 文档：https://docs.anthropic.com/
- Trellis 文档：https://docs.trytrellis.app/

## Requirements

### 1. 文档布局组件
- [ ] 创建 `DocLayout.astro` 布局组件
- [ ] 左侧边栏：固定宽度 280px，显示文档目录树
- [ ] 中间内容区：自适应宽度，最大宽度 800px
- [ ] 右侧 TOC：固定宽度 200px，显示当前页面目录大纲
- [ ] 三栏布局：侧边栏（280px）+ 内容（800px）+ TOC（200px）

### 2. 侧边栏导航（基于文件系统）
- [ ] 自动扫描 `src/content/docs/[system]/` 目录生成目录树
- [ ] 支持多级目录结构（文件夹嵌套）
- [ ] 通过 frontmatter 的 `order` 字段控制排序
- [ ] 当前页面高亮显示
- [ ] 可折叠/展开的目录组
- [ ] 平滑滚动到当前项

### 3. 内容区域
- [ ] Markdown 渲染（复用现有 prose 样式）
- [ ] 代码高亮
- [ ] 代码复制按钮
- [ ] 图片支持
- [ ] 表格样式
- [ ] 标题锚点链接

### 4. 右侧目录大纲（TOC）
- [ ] 自动提取当前页面的 h2/h3 标题
- [ ] 点击跳转到对应章节
- [ ] 滚动时高亮当前章节
- [ ] 固定定位，跟随页面滚动

### 5. 增强导航功能
- [ ] 面包屑导航：显示当前位置（首页 > gzDoc > API 文档 > 文档 API）
- [ ] 上一页/下一页：文档底部的导航按钮（基于目录树顺序）
- [ ] 编辑此页：链接到 GitHub 源文件
- [ ] 最后更新时间：显示文档的 Git 最后修改时间

### 6. 响应式设计
- [ ] 桌面端（≥1280px）：三栏布局（侧边栏 + 内容 + TOC）
- [ ] 平板端（768px-1279px）：两栏布局（侧边栏 + 内容，隐藏 TOC）
- [ ] 移动端（<768px）：单栏布局 + 汉堡菜单
  - [ ] 左上角汉堡菜单按钮（☰）
  - [ ] 点击后侧边栏从左侧滑入
  - [ ] 显示半透明遮罩层
  - [ ] 点击遮罩或关闭按钮收起侧边栏

### 7. 文档路由
- [ ] `/doc` - 文档系统列表（已存在）
- [ ] `/doc/[system]` - 系统文档首页（重定向到 index.md）
- [ ] `/doc/[system]/[...slug]` - 具体文档页面

### 8. Frontmatter 规范
```yaml
---
title: 文档标题
description: 文档描述
order: 1  # 在同级目录中的排序
---
```

## Acceptance Criteria

- [ ] 左侧边栏固定，可滚动，显示完整目录树
- [ ] 中间内容区域正确渲染 Markdown
- [ ] 当前页面在侧边栏中高亮
- [ ] 移动端侧边栏可通过按钮展开/收起
- [ ] 代码块有复制按钮
- [ ] 深色模式适配
- [ ] 页面加载性能良好

## Definition of Done

- 布局组件实现并测试通过
- 至少一个文档系统（gzDoc）完整展示
- 移动端和桌面端都测试通过
- 深色模式正常工作
- 提交并推送到远程仓库

## Open Questions

✅ 已确认：
1. **目录结构**：基于文件系统（文件夹结构即目录结构，通过 frontmatter 的 order 控制顺序）
2. **右侧 TOC**：需要（三栏布局，桌面端显示，移动端隐藏）
3. **移动端交互**：汉堡菜单 + 抽屉式侧边栏

## Out of Scope

- ~~文档搜索功能~~（将在全局搜索中添加"官方文档"筛选模式，作为独立任务）
- 文档版本切换（后续迭代）
- 多语言支持（后续迭代）
- 文档评论功能（后续迭代）
- 文档贡献者列表（后续迭代）

## Technical Notes

### 文件结构
```
src/
  layouts/
    DocLayout.astro          # 文档布局组件
  components/
    DocSidebar.astro         # 左侧边栏
    DocTOC.astro             # 右侧目录大纲
    DocBreadcrumb.astro      # 面包屑导航
    DocPagination.astro      # 上一页/下一页
  pages/
    doc/
      index.astro            # 文档系统列表（已存在）
      [system]/
        [...slug].astro      # 动态文档页面
  content/
    docs/
      gzDoc/                 # gzDoc 文档系统
        index.md             # 系统首页
        getting-started.md   # 快速开始
        guide/               # 指南目录
          installation.md
          configuration.md
        api/                 # API 目录
          document.md
          qa.md
```

### 技术实现要点

1. **Content Collections API**
   - 使用 Astro 的 `getCollection('docs')` 读取文档
   - 按 `system` 分组，按 `order` 排序

2. **目录树生成**
   - 扫描文件系统结构
   - 递归构建树形数据结构
   - 支持文件夹嵌套

3. **TOC 生成**
   - 使用 `remark-toc` 或手动解析 Markdown AST
   - 提取 h2/h3 标题及其 id
   - 客户端 JS 监听滚动事件高亮当前章节

4. **上一页/下一页逻辑**
   - 将目录树扁平化为有序列表
   - 根据当前页面位置找到前后页面

5. **Git 信息获取**
   - 使用 `git log -1 --format=%ai <file>` 获取最后修改时间
   - 构建 GitHub 编辑链接：`https://github.com/GeezCo/GeezCo.github.io/edit/main/src/content/docs/...`

6. **响应式实现**
   - CSS Grid 三栏布局
   - 媒体查询控制显示/隐藏
   - 移动端使用 `position: fixed` + `transform: translateX()` 实现抽屉效果

### 参考资源
- Vue 文档：https://vuejs.org/guide/
- React 文档：https://react.dev/learn
- Astro Content Collections：https://docs.astro.build/en/guides/content-collections/
- Trellis 文档：https://docs.trytrellis.app/

---

## Implementation Plan

### Phase 1: 基础布局和路由
1. 配置 Content Collections（`src/content/config.ts` 添加 docs collection）
2. 创建动态路由 `src/pages/doc/[system]/[...slug].astro`
3. 创建 `DocLayout.astro` 基础三栏布局
4. 实现基础 Markdown 渲染

### Phase 2: 侧边栏导航
1. 创建 `DocSidebar.astro` 组件
2. 实现目录树生成逻辑（基于文件系统）
3. 实现当前页面高亮
4. 实现可折叠/展开功能
5. 添加移动端汉堡菜单和抽屉效果

### Phase 3: 右侧 TOC
1. 创建 `DocTOC.astro` 组件
2. 提取文档标题生成 TOC
3. 实现滚动高亮当前章节
4. 响应式隐藏（平板/移动端）

### Phase 4: 增强导航
1. 创建 `DocBreadcrumb.astro` 面包屑组件
2. 创建 `DocPagination.astro` 上下页组件
3. 添加"编辑此页"链接
4. 添加最后更新时间

### Phase 5: 样式和优化
1. 深色模式适配
2. 响应式布局优化
3. 动画和过渡效果
4. 性能优化（懒加载、预加载）

---

## Final Confirmation

这是我对完整需求的理解：

**目标**：实现专业的文档系统布局，类似 Vue/React/Claude Code 官方文档

**核心功能**：
- 三栏布局：左侧边栏（280px）+ 中间内容（800px）+ 右侧 TOC（200px）
- 基于文件系统的目录结构，通过 frontmatter 的 order 控制排序
- 自动生成目录树和 TOC
- 面包屑导航、上下页导航、编辑链接、更新时间
- 响应式设计：桌面三栏、平板两栏、移动端汉堡菜单

**技术方案**：
- Astro Content Collections API
- 动态路由 `/doc/[system]/[...slug]`
- CSS Grid 布局 + 媒体查询
- 客户端 JS 处理 TOC 滚动高亮

**Out of Scope**：
- 文档搜索（将在全局搜索中添加"官方文档"筛选）
- 版本切换、多语言、评论功能

确认无误后，我将开始实施。是否有需要调整的地方？
