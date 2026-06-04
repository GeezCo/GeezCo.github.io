# 修复搜索功能样式和加载状态

## Goal

修复搜索功能的两个关键问题：
1. 卡片样式不稳定（Astro 作用域冲突导致）
2. 缺少搜索加载动画（用户体验差）

确保搜索功能的样式 100% 稳定生效，并提供流畅的加载反馈。

## What I already know

### 当前状态
- 搜索功能基本完成：卡片样式、排序、高亮等
- 已有空结果提示和错误处理
- 使用 Pagefind 作为搜索引擎
- 组件：`src/components/SearchModal.astro`

### 已发现的问题

**问题 1：样式不稳定**
- 症状：卡片样式有时生效，有时不生效
- 根本原因：Astro 作用域冲突
  - `<script is:inline>` 动态生成 HTML，类名为 `.search-result-item`
  - `<style>` 被 Astro 编译为 `.search-result-item[data-astro-xxx]`
  - 类名不匹配 → 样式失效
- 影响范围：所有动态生成的元素（卡片、排序按钮、加载更多按钮等）

**问题 2：缺少加载动画**
- 症状：用户输入后 300ms 静默，然后突然显示结果
- 影响：用户不知道是否在搜索，体验差
- 需要：显示旋转加载图标 + "搜索中..." 文字

**问题 3 & 4：已解决**
- ✅ 空结果提示：已有 "未找到相关文章"
- ✅ 错误处理：已有 "搜索出错，请重试"

## Requirements

### 核心需求（MVP）

**1. 修复样式作用域问题**
- [ ] 将所有动态生成的类包裹在 `:global()` 中
- [ ] 需要包裹的类（15+ 个）：
  - `.search-sort-bar`
  - `.sort-btn` 及其伪类（`:hover`, `.active`）
  - `.search-result-item` 及其伪类（`:hover`, `:last-child`）
  - `.search-result-header`
  - `.search-result-icon`
  - `.search-result-title`
  - `.search-result-excerpt`
  - `.search-result-item mark`
  - `.search-result-meta`
  - `.search-result-tags` 及 `.tag`
  - `.search-result-date`
  - `.load-more-btn`
- [ ] 静态 HTML 的类不需要包裹（避免污染全局）

**2. 添加搜索加载动画**
- [ ] HTML 结构
  - 添加 `<div id="search-loading">` 元素
  - 包含 SVG 旋转图标 + 文字提示
  - 位置：`#search-results` 之前
- [ ] CSS 样式
  - 默认隐藏（`display: none`）
  - Flexbox 居中布局
  - SVG 旋转动画（`@keyframes spin`）
  - 圆圈描边动画（`@keyframes dash`）
  - 深色模式适配
- [ ] JS 逻辑
  - 搜索开始时显示加载状态
  - 搜索结束时隐藏加载状态
  - 修改 3 处：`doSearch()`、`close()`、变量声明

**3. 保持现有功能**
- [ ] 不影响现有的搜索、排序、高亮功能
- [ ] 不影响空结果提示和错误处理
- [ ] 深色模式完全适配

## Acceptance Criteria

- [ ] 卡片样式在任何情况下都稳定生效
- [ ] 搜索时显示旋转加载动画
- [ ] 加载动画流畅（60fps）
- [ ] 深色模式下样式正常
- [ ] 无 console 错误
- [ ] 现有功能不受影响
- [ ] 浏览器强制刷新后样式仍然正常

## Definition of Done

- 代码实现并测试通过
- 样式在浅色/深色模式下正常
- 加载动画流畅无卡顿
- 无 console 错误
- 提交到 Git 仓库

## Out of Scope

- 搜索结果缓存
- 键盘导航优化
- 搜索历史记录
- 搜索建议/自动完成

## Technical Approach

### 实现策略

**1. 样式作用域修复**
```css
/* 修改前 */
.search-result-item {
  border: 1px solid #e4e4e7;
  ...
}

/* 修改后 */
:global(.search-result-item) {
  border: 1px solid #e4e4e7;
  ...
}
```

**2. 加载动画实现**

HTML（第 18 行后添加）：
```html
<div id="search-loading" class="search-loading">
  <svg class="spinner" viewBox="0 0 50 50">
    <circle cx="25" cy="25" r="20" stroke-linecap="round"/>
  </svg>
  <span>搜索中...</span>
</div>
```

CSS：
```css
:global(.search-loading) {
  display: none;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 3rem 2rem;
  color: #71717a;
}

:global(.spinner) {
  width: 2.5rem;
  height: 2.5rem;
  animation: spin 1s linear infinite;
}

:global(.spinner circle) {
  stroke: #4f46e5;
  stroke-width: 4;
  fill: none;
  stroke-dasharray: 80, 200;
  animation: dash 1.5s ease-in-out infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes dash {
  0% { stroke-dasharray: 1, 200; stroke-dashoffset: 0; }
  50% { stroke-dasharray: 90, 200; stroke-dashoffset: -35; }
  100% { stroke-dasharray: 90, 200; stroke-dashoffset: -125; }
}
```

JS 修改点：
```javascript
// 1. 添加变量（第 29 行）
const loading = document.getElementById('search-loading');

// 2. 修改 doSearch 函数
async function doSearch(query) {
  if (!query.trim()) {
    loading.style.display = 'none';  // 新增
    ...
    return;
  }
  
  // 显示加载
  loading.style.display = 'flex';  // 新增
  empty.style.display = 'none';
  results.innerHTML = '';  // 新增
  
  try {
    const search = await pagefind.search(query);
    loading.style.display = 'none';  // 新增
    ...
  } catch (error) {
    loading.style.display = 'none';  // 新增
    ...
  }
}

// 3. 修改 close 函数
function close() {
  loading.style.display = 'none';  // 新增
  ...
}
```

### 文件修改清单
- `src/components/SearchModal.astro`
  - HTML：+7 行（加载动画）
  - CSS：+50 行（:global() 包裹 + 加载动画）
  - JS：+6 行（加载状态控制）

### 技术细节

**为什么使用 :global()**
- Astro 默认会给 `<style>` 中的类添加作用域（hash）
- `<script is:inline>` 动态生成的 HTML 没有这个 hash
- `:global()` 让类名保持原样，不添加 hash
- 只对动态生成的类使用，静态 HTML 的类保持作用域

**加载动画设计**
- 使用 SVG + CSS 动画（性能好，可缩放）
- 两层动画：旋转 + 描边动画
- 描边动画模拟加载进度效果
- 深色模式下调整颜色

## Decision (ADR-lite)

**Context**
- 搜索功能已基本完成，但样式不稳定
- 用户反馈缺少加载反馈
- Astro 的作用域机制导致动态生成的 HTML 样式失效

**Decision**
1. 使用 `:global()` 包裹所有动态生成的类
2. 添加 SVG + CSS 动画的加载状态
3. 不使用 `<style is:global>`（避免污染全局）

**Consequences**
- ✅ 样式 100% 稳定生效
- ✅ 用户体验更流畅
- ✅ 性能无影响（CSS 动画）
- ⚠️ 需要手动维护 :global() 列表
- ⚠️ 新增动态类时需要记得包裹

## References

- Astro 样式作用域文档：https://docs.astro.build/en/guides/styling/#scoped-styles
- CSS 动画性能：https://web.dev/animations-guide/
- 相关任务：`.trellis/tasks/05-26-search-enhance/`
