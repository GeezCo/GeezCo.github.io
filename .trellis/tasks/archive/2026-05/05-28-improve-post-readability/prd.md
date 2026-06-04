# 美化博客阅读页排版

## Goal

优化博客文章阅读页的排版，解决文字过于紧凑的问题，提升阅读体验。同时按照 AI 助手的风格重写最新文章（platform-plugin-architecture-design.md）。

## What I already know

### 当前问题
- 文章正文文字太紧凑，观感不好
- 需要改善段落间距、行高、字体大小等排版细节
- 最新文章：`platform-plugin-architecture-design.md`（关于平台+插件架构设计）

### 当前实现
- 文章布局：`src/layouts/PostLayout.astro`
- 正文样式：`src/styles/global.css` 中的 `.prose` 类
- 当前行高：`body { line-height: 1.75; }`
- 最大宽度：`max-width: 800px`

### 技术栈
- Astro 6
- Tailwind CSS v4
- Markdown 渲染

## Requirements

### 1. 排版优化
- [x] 段落间距：2em（宽松，易扫读）
- [x] 增加正文字体大小到 18px
- [x] 优化标题间距（h2: 3rem, h3: 2rem, h4: 1.5rem）
- [x] 调整正文行高到 1.8
- [x] 优化列表间距（ul, ol, li）
- [x] 改善代码块周围的留白（margin: 1.5em 0 2em）
- [x] 优化引用块的视觉层次（margin: 2em 0）
- [x] 确保移动端响应式体验

### 2. Header 导航优化
- [x] 将搜索框移到导航栏最左边（logo 右侧）
- [x] 调整导航菜单顺序

### 3. Favicon 更新
- [x] 使用新的 favicon.png
- [x] 删除旧的 favicon.svg 和 favicon.ico
- [x] 更新 BaseLayout.astro 中的引用

### 4. 文章重写
- [x] 重写 `platform-plugin-architecture-design.md`
- [x] 移除数据库设计细节
- [x] 使用专业、技术化的风格（不要太有感情）
- [x] 保持架构设计的核心内容
- [x] 优化段落结构和逻辑流

## Acceptance Criteria

- [x] 段落之间有明显的视觉间隔（不少于 1.5em）
- [x] 标题层级清晰，视觉权重合理
- [x] 正文行高舒适（建议 1.8-2.0）
- [x] 代码块、引用块与正文有明显区分
- [x] 移动端（< 768px）阅读体验良好
- [x] 重写后的文章保持原文信息完整性
- [x] 文章风格专业、清晰、易读

## Definition of Done

- 样式更新后本地测试通过
- 在浅色/深色模式下都显示正常
- 移动端和桌面端都测试通过
- 重写的文章经过审阅确认
- 提交并推送到远程仓库

## Open Questions

✅ 已确认：
- 段落间距：2em（宽松）
- 搜索框位置：移到导航栏最左边
- 文章风格：专业技术化，不要太有感情，不放数据库设计

## Out of Scope

- 不修改其他文章内容
- 不改变整体网站配色方案
- 不重构 Markdown 渲染引擎

## Technical Notes

- 文件路径：
  - 布局：`src/layouts/PostLayout.astro`
  - 样式：`src/styles/global.css`
  - 文章：`src/content/blog/platform-plugin-architecture-design.md`
- 使用 Tailwind CSS v4 自定义变量
- 需要考虑深色模式适配
