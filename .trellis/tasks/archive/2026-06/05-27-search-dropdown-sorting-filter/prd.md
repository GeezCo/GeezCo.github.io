# 搜索排序下拉框与内容过滤

## Goal

将搜索功能的排序方式从横向按钮改为下拉框，并新增"根据内容"排序选项。不同排序方式下，不符合条件的结果排在后面（不隐藏）。

## What I already know

### 当前实现（来自 SearchModal.astro）

**UI 结构：**
- 排序栏：3 个横向按钮（相关性、标题匹配、最新发布）
- 位置：搜索输入框下方
- 样式：`.search-sort-bar` + `.sort-btn`

**排序逻辑：**
```javascript
function sortResults(results, sortBy, query) {
  switch(sortBy) {
    case 'relevance': // 按 Pagefind 的 score 排序
      return sorted.sort((a, b) => b.score - a.score);
    case 'title': // 标题包含关键词的优先
      return sorted.sort((a, b) => {
        const aMatch = a.meta.title.toLowerCase().includes(query.toLowerCase());
        const bMatch = b.meta.title.toLowerCase().includes(query.toLowerCase());
        if (aMatch && !bMatch) return -1;
        if (!aMatch && bMatch) return 1;
        return b.score - a.score;
      });
    case 'date': // 按日期从新到旧
      return sorted.sort((a, b) => {
        const dateA = new Date(a.meta.date || '1970-01-01');
        const dateB = new Date(b.meta.date || '1970-01-01');
        return dateB - dateA;
      });
  }
}
```

**数据结构：**
- `allResults[]` 存储所有搜索结果
- 每个结果包含：`score`, `meta.title`, `meta.date`, `excerpt`
- `excerpt` 已包含高亮的 `<mark>` 标签

**搜索引擎：**
- Pagefind（静态全文搜索）
- 搜索范围：标题 + 正文内容
- 返回：`score`（相关性分数）+ `excerpt`（匹配片段）

## Assumptions (temporary)

1. **"根据内容"的定义**：正文（excerpt）中包含关键词的结果
2. **过滤行为**：不符合条件的结果完全隐藏（不显示在列表中）
3. **下拉框位置**：替换当前的横向按钮栏
4. **默认选项**：相关性（与当前一致）

## Open Questions

（无待解决问题）

## Requirements

### 核心需求

1. **UI 改造：原生 `<select>` 下拉框**
   - [ ] 将 3 个横向按钮改为原生 `<select>` 下拉框
   - [ ] 下拉框选项顺序：
     1. 相关性（默认，`value="relevance"`）
     2. 根据标题（`value="title"`）
     3. 根据内容（新增，`value="content"`）
     4. 最新发布（`value="date"`）
   - [ ] CSS 美化：圆角、边框、背景色、下拉箭头
   - [ ] **布局：左对齐，不占满整行（auto 宽度）**
   - [ ] 深色模式适配
   - [ ] 移动端友好（调用系统选择器）

2. **新增排序选项：根据内容**
   - [ ] 添加 `<option value="content">根据内容</option>`
   - [ ] 排序逻辑：
     - 正文（excerpt）包含关键词的结果排在前面
     - 不包含的结果排在后面
     - 同组内按相关性分数（score）排序
   - [ ] 示例：搜索 "Redis"
     - 前面：《数据库优化》（正文提到 Redis）
     - 后面：《Redis 配置》（标题有但正文没提到）

3. **排序逻辑调整（不隐藏，只排序）**
   - [ ] **相关性**：按 score 从高到低（所有结果）
   - [ ] **根据标题**：
     - 标题包含关键词的排在前面
     - 不包含的排在后面
     - 同组内按 score 排序
   - [ ] **根据内容**：
     - 正文包含关键词的排在前面
     - 不包含的排在后面
     - 同组内按 score 排序
   - [ ] **最新发布**：按日期从新到旧（所有结果）

4. **交互行为**
   - [ ] 用户切换下拉框选项时，结果立即重新排序
   - [ ] 保持当前的分页加载（每次显示 10 条）
   - [ ] 排序后重置到第一页
   - [ ] 显示所有结果（不隐藏任何结果）

### 现有功能保持

- [ ] 搜索、高亮、分页加载功能不变
- [ ] 加载动画正常工作
- [ ] 深色模式适配
- [ ] 快捷键（Ctrl+K / ⌘K）正常

## Acceptance Criteria

- [ ] 下拉框显示 4 个选项，顺序正确
- [ ] 默认选中"相关性"
- [ ] 切换选项时，结果立即重新排序
- [ ] "根据标题"：标题包含关键词的排在前面，不包含的排在后面
- [ ] "根据内容"：正文包含关键词的排在前面，不包含的排在后面
- [ ] 所有结果都显示（不隐藏任何结果）
- [ ] 排序后重置到第一页
- [ ] 深色模式下样式正常
- [ ] 移动端下拉框体验良好
- [ ] 无 console 错误

## Definition of Done (team quality bar)

- 代码实现并测试通过
- 所有排序选项功能正常
- 过滤逻辑正确
- 深色模式适配
- 无 console 错误
- 提交到 Git 仓库

## Out of Scope (explicit)

- 多条件组合过滤（如：标题 + 内容同时匹配）
- 高级搜索语法（如：`title:Redis`）
- 搜索历史记录
- 搜索结果导出

## Technical Notes

### 文件位置
- `src/components/SearchModal.astro`

### 当前排序按钮实现
```html
<div class="search-sort-bar">
  <button class="sort-btn active" data-sort="relevance">相关性</button>
  <button class="sort-btn" data-sort="title">标题匹配</button>
  <button class="sort-btn" data-sort="date">最新发布</button>
</div>
```

### 需要修改的部分
1. HTML：按钮 → `<select>` 下拉框
2. CSS：下拉框样式（`.search-sort-bar` → `.search-sort-dropdown`）
3. JS：
   - 事件监听：`click` → `change`
   - 新增 `case 'content'` 分支
   - 实现过滤逻辑

### Pagefind 数据结构
```javascript
{
  score: 0.85,           // 相关性分数
  meta: {
    title: "文章标题",
    date: "2026-05-27",
    tags: "tag1,tag2"
  },
  excerpt: "...匹配的<mark>关键词</mark>片段...",
  url: "/blog/post-slug"
}
```

### 过滤实现思路（已废弃 - 改为排序）

排序逻辑（不过滤，只排序）：

```javascript
function sortResults(results, sortBy, query) {
  const sorted = [...results];
  switch(sortBy) {
    case 'relevance':
      // 按相关性分数排序
      return sorted.sort((a, b) => b.score - a.score);
      
    case 'title':
      // 标题包含关键词的排在前面
      return sorted.sort((a, b) => {
        const aMatch = a.meta.title.toLowerCase().includes(query.toLowerCase());
        const bMatch = b.meta.title.toLowerCase().includes(query.toLowerCase());
        if (aMatch && !bMatch) return -1;
        if (!aMatch && bMatch) return 1;
        return b.score - a.score; // 同组内按相关性
      });
      
    case 'content':
      // 正文包含关键词的排在前面（新增）
      return sorted.sort((a, b) => {
        const aMatch = a.excerpt.toLowerCase().includes(query.toLowerCase());
        const bMatch = b.excerpt.toLowerCase().includes(query.toLowerCase());
        if (aMatch && !bMatch) return -1;
        if (!aMatch && bMatch) return 1;
        return b.score - a.score; // 同组内按相关性
      });
      
    case 'date':
      // 按日期从新到旧
      return sorted.sort((a, b) => {
        const dateA = new Date(a.meta.date || '1970-01-01');
        const dateB = new Date(b.meta.date || '1970-01-01');
        return dateB - dateA;
      });
  }
}
```

## Technical Approach

### 实现步骤

**1. HTML 改造（第 13-17 行）**

修改前：
```html
<div class="search-sort-bar">
  <button class="sort-btn active" data-sort="relevance">相关性</button>
  <button class="sort-btn" data-sort="title">标题匹配</button>
  <button class="sort-btn" data-sort="date">最新发布</button>
</div>
```

修改后：
```html
<div class="search-sort-bar">
  <label for="search-sort" class="sort-label">排序方式：</label>
  <select id="search-sort" class="search-sort-select">
    <option value="relevance">相关性</option>
    <option value="title">根据标题</option>
    <option value="content">根据内容</option>
    <option value="date">最新发布</option>
  </select>
</div>
```

**2. CSS 样式（替换 `.sort-btn` 相关样式）**

```css
:global(.search-sort-bar) {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.25rem;
  border-bottom: 1px solid #e4e4e7;
  background: #fafafa;
}

:global(.sort-label) {
  font-size: 0.85rem;
  color: #71717a;
  font-weight: 500;
}

:global(.search-sort-select) {
  flex: 1;
  padding: 0.5rem 2rem 0.5rem 0.75rem;
  font-size: 0.85rem;
  border: 1px solid #e4e4e7;
  border-radius: 0.375rem;
  background: #ffffff;
  color: #18181b;
  cursor: pointer;
  font-family: inherit;
  appearance: none;
  background-image: url("data:image/svg+xml,..."); /* 自定义下拉箭头 */
  background-repeat: no-repeat;
  background-position: right 0.5rem center;
  background-size: 1rem;
  transition: all 0.2s;
}

:global(.search-sort-select:hover) {
  border-color: #4f46e5;
}

:global(.search-sort-select:focus) {
  outline: none;
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

/* 深色模式 */
:global(html.dark) :global(.search-sort-bar) {
  border-bottom-color: #3f3f46;
  background: #18181b;
}

:global(html.dark) :global(.sort-label) {
  color: #a1a1aa;
}

:global(html.dark) :global(.search-sort-select) {
  border-color: #3f3f46;
  background: #27272a;
  color: #fafafa;
}

:global(html.dark) :global(.search-sort-select:hover) {
  border-color: #818cf8;
}
```

**3. JavaScript 修改**

修改点 1：变量声明（第 36 行）
```javascript
// 修改前
const sortBtns = document.querySelectorAll('.sort-btn');

// 修改后
const sortSelect = document.getElementById('search-sort');
```

修改点 2：事件监听（第 240-250 行）
```javascript
// 修改前
sortBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    sortBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentSort = btn.dataset.sort;
    if (currentQuery) {
      allResults = sortResults(allResults, currentSort, currentQuery);
      displayedCount = 0;
      renderResults(0);
    }
  });
});

// 修改后
sortSelect.addEventListener('change', (e) => {
  currentSort = e.target.value;
  if (currentQuery && allResults.length > 0) {
    allResults = sortResults(allResults, currentSort, currentQuery);
    displayedCount = 0;
    results.innerHTML = '';
    renderResults(0);
  }
});
```

修改点 3：close 函数（第 70-85 行）
```javascript
// 修改前
sortBtns.forEach(btn => btn.classList.remove('active'));
sortBtns[0].classList.add('active');
currentSort = 'relevance';

// 修改后
sortSelect.value = 'relevance';
currentSort = 'relevance';
```

修改点 4：sortResults 函数（第 94-117 行）
```javascript
// 添加 case 'content' 分支
case 'content':
  return sorted.sort((a, b) => {
    const aMatch = a.excerpt.toLowerCase().includes(query.toLowerCase());
    const bMatch = b.excerpt.toLowerCase().includes(query.toLowerCase());
    if (aMatch && !bMatch) return -1;
    if (!aMatch && bMatch) return 1;
    return b.score - a.score;
  });
```

### 文件修改清单

- `src/components/SearchModal.astro`
  - HTML：~5 行修改（按钮 → 下拉框）
  - CSS：~60 行修改（删除按钮样式，新增下拉框样式）
  - JS：~15 行修改（事件监听 + 新增 content 排序）

### 下拉箭头 SVG

```svg
data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'%3E%3Cpath fill='%2371717a' d='M4 6l4 4 4-4'/%3E%3C/svg%3E
```

深色模式：
```svg
data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'%3E%3Cpath fill='%23a1a1aa' d='M4 6l4 4 4-4'/%3E%3C/svg%3E
```

## Decision (ADR-lite)

**Context**
- 当前使用 3 个横向按钮进行排序切换
- 需要新增"根据内容"排序选项
- 用户希望将排序方式汇总为下拉框
- 需要保持简洁的 UI 和良好的用户体验

**Decision**
1. 使用原生 `<select>` 元素 + CSS 美化
2. 不隐藏不符合条件的结果，只调整排序顺序
3. "根据标题" 和 "根据内容" 采用相同的排序逻辑：匹配的排在前面，不匹配的排在后面

**Consequences**
- ✅ 实现简单，兼容性好
- ✅ 移动端体验好（调用系统选择器）
- ✅ 无障碍访问友好
- ✅ 用户可以看到所有结果，不会因为过滤而遗漏
- ⚠️ 下拉框样式定制受限（但足够美观）
- ⚠️ 不匹配的结果仍然显示，可能需要滚动查看
