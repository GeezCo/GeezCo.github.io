# 优化搜索结果：分块显示 + 多维度排序

## Goal

改进当前搜索功能的结果展示，从"文字堆砌"变为结构化的卡片显示，并支持多维度排序（相关性、标题匹配、日期），提升用户搜索体验。

## What I already know

### 当前实现
- 使用 Pagefind 全文搜索引擎
- 搜索结果显示：标题 + 摘要 + 标签 + 日期
- 限制显示 8 条结果（`slice(0, 8)`）
- 结果以列表形式连续显示，无分块

### 用户反馈的问题
- 搜索结果"只包含文字的"，视觉上是"一堆文字堆砌"
- 缺少结构化分块（每篇文章应该是独立的卡片）
- 缺少排序功能

### 技术约束
- Pagefind API 返回的数据结构：
  - `search.results[]` - 搜索结果数组
  - `result.data()` - 异步获取完整数据
  - `data.meta` - 元数据（title, tags, date）
  - `data.excerpt` - 摘要片段
  - `data.score` - Pagefind 内置相关性评分

## Assumptions (temporary)

- 文章的评论数据可能存储在 frontmatter 中（需要验证）
- Pagefind 的 `score` 可以用于相关性排序
- 需要区分"标题匹配"和"内容匹配"（可能需要自定义逻辑）

## Open Questions

### 1. ✅ 评论数据来源（已确认）
**决定：暂时不支持评论数排序**
- 原因：Giscus API 调用复杂，会增加搜索延迟
- 未来可通过预构建方式实现
- 详见：`research/comment-systems.md`

### 2. ✅ 分块显示的具体形式（已确认）
**决定：每篇文章独立卡片 + 匹配高亮**
- 每个搜索结果显示为独立卡片（边框/阴影/间距）
- 匹配到的关键词加粗高亮显示
- 保持现有的图标、标签、日期元素

### 3. ✅ 排序交互方式（已确认）
**决定：标签切换按钮**
- 搜索框下方显示排序选项（标签按钮形式）
- 选项：「相关性」「标题匹配」「最新发布」
- 当前选中的标签高亮显示
- 点击切换排序方式

## Requirements (evolving)

### 核心需求（MVP）

**1. 卡片样式优化**
- [ ] 每个搜索结果显示为独立卡片
  - 添加边框或阴影
  - 卡片之间有明显间距（如 0.75rem）
  - 保持 hover 动画效果
- [ ] 匹配关键词高亮显示
  - 标题中的匹配词加粗
  - 摘要中的匹配词加粗
  - 使用醒目颜色（如主题色）

**2. 排序功能**
- [ ] 排序选项栏（标签按钮）
  - 位置：搜索框下方
  - 选项：「相关性」「标题匹配」「最新发布」
  - 当前选中的标签高亮
- [ ] 排序逻辑实现
  - **相关性**：使用 Pagefind 的 `score` 字段
  - **标题匹配**：检查标题是否包含搜索关键词，包含的排在前面
  - **最新发布**：按 `date` 字段降序排序
- [ ] 默认排序：相关性

**3. 保持现有功能**
- [ ] 标签显示（最多 3 个）
- [ ] 发布日期显示
- [ ] 摘要显示（限制 120 字符）
- [ ] 深色模式适配
- [ ] 移动端响应式

### 待确认需求
- ~~是否显示匹配类型标签~~（不需要，通过排序体现）

## Acceptance Criteria (evolving)

- [ ] 搜索结果每篇文章有明显的卡片样式（边框/阴影/间距）
- [ ] 匹配关键词在标题和摘要中加粗高亮
- [ ] 排序栏显示 3 个选项，点击可切换
- [ ] 相关性排序：按 Pagefind score 排序
- [ ] 标题匹配排序：标题包含关键词的排在前面
- [ ] 最新发布排序：按日期降序排序
- [ ] 排序切换后结果立即更新
- [ ] 深色模式下样式正常
- [ ] 移动端显示正常（排序栏自适应）
- [ ] 无 console 错误
- [ ] 搜索响应时间 < 500ms

## Definition of Done

- 代码实现并测试通过
- 样式在浅色/深色模式下正常
- 移动端响应式适配
- 无 console 错误
- 性能无明显下降（搜索响应时间 < 500ms）

## Decision (ADR-lite)

**Context**
- 用户反馈搜索结果"只包含文字"，视觉上缺乏结构
- 需要支持多种排序方式以满足不同查找需求
- 评论数排序需要调用 GitHub API，会增加复杂度和延迟

**Decision**
1. 采用独立卡片样式，每个结果有明显视觉分隔
2. 实现 3 种排序方式：相关性、标题匹配、最新发布
3. 使用标签按钮切换排序（而非下拉菜单）
4. 暂不支持评论数排序，留作未来功能

**Consequences**
- ✅ 视觉层次更清晰，易于扫描
- ✅ 排序功能满足主要使用场景
- ✅ 实现简单，无需外部 API 调用
- ⚠️ 评论数排序需要后续迭代（见 `research/comment-systems.md`）

## Out of Scope (explicit)

- 评论数排序（未来功能，见 `research/comment-systems.md`）
- 搜索结果分页（当前限制 8 条）
- 高级搜索语法（AND/OR/NOT）
- 搜索历史记录
- 搜索结果导出

## Technical Approach

### 实现策略

**1. 卡片样式改进**
- 修改 `.search-result-item` 样式
  - 添加 `border: 1px solid` 或 `box-shadow`
  - 增加 `margin-bottom` 间距
  - 调整 `padding` 和 `border-radius`
- 保持现有的 hover 动画

**2. 关键词高亮**
- Pagefind 的 `excerpt` 已包含 `<mark>` 标签
- 保留 `<mark>` 标签，添加 CSS 样式（加粗 + 颜色）
- 标题高亮：需要手动匹配关键词并包裹 `<mark>`

**3. 排序功能实现**
```javascript
// 数据结构
let allResults = []; // 存储所有搜索结果
let currentSort = 'relevance'; // 当前排序方式

// 排序函数
function sortResults(results, sortBy, query) {
  switch(sortBy) {
    case 'relevance':
      return results.sort((a, b) => b.score - a.score);
    case 'title':
      return results.sort((a, b) => {
        const aMatch = a.meta.title.toLowerCase().includes(query.toLowerCase());
        const bMatch = b.meta.title.toLowerCase().includes(query.toLowerCase());
        if (aMatch && !bMatch) return -1;
        if (!aMatch && bMatch) return 1;
        return b.score - a.score; // 相同则按相关性
      });
    case 'date':
      return results.sort((a, b) => {
        const dateA = new Date(a.meta.date);
        const dateB = new Date(b.meta.date);
        return dateB - dateA;
      });
  }
}
```

**4. UI 结构**
```html
<div class="search-input-wrap">...</div>
<div class="search-sort-bar">
  <button class="sort-btn active" data-sort="relevance">相关性</button>
  <button class="sort-btn" data-sort="title">标题匹配</button>
  <button class="sort-btn" data-sort="date">最新发布</button>
</div>
<div id="search-results"></div>
```

### 技术细节

**Pagefind API 返回的数据**
```javascript
{
  score: 0.85,  // 相关性评分
  meta: {
    title: "文章标题",
    date: "2022-09-11",
    tags: "Redis,Java"
  },
  excerpt: "摘要内容 <mark>关键词</mark> 更多内容",
  url: "/posts/..."
}
```

**关键词高亮逻辑**
- 摘要：Pagefind 自动添加 `<mark>` 标签
- 标题：手动实现高亮
  ```javascript
  function highlightTitle(title, query) {
    const regex = new RegExp(`(${query})`, 'gi');
    return title.replace(regex, '<mark>$1</mark>');
  }
  ```

### 文件修改清单
- `src/components/SearchModal.astro`
  - 添加排序栏 HTML
  - 修改搜索逻辑（存储所有结果）
  - 添加排序函数
  - 添加排序按钮事件监听
  - 修改卡片样式 CSS
  - 添加 `<mark>` 标签样式