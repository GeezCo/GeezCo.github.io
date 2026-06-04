# brainstorm: 代码块跟随主题切换

## Goal

让博客文章中的代码块（`<pre><code>`）能够跟随主题切换，在浅色模式和深色模式下显示不同的背景色和语法高亮配色。

## What I already know

### 当前问题
从 `src/styles/global.css` 第 126-141 行：
```css
.prose pre {
  background-color: #1e1e1e;  /* 固定深色背景 */
  color: #d4d4d4;
}
```

- 代码块固定使用深色背景 `#1e1e1e`
- 在浅色模式下也是深色背景（不协调）
- 行内代码有 `html.dark` 适配，但代码块没有

### 当前技术栈
- Astro 静态站点生成
- Markdown 渲染：使用 Astro 内置的 Markdown 处理
- 代码高亮：Astro 默认使用 Shiki（从 `astro.config.mjs` 看没有自定义配置）
- 主题切换：通过 `html.dark` 类名实现

## Assumptions (temporary)

- Astro 的 Shiki 支持配置多个主题（浅色/深色）
- 需要在 `astro.config.mjs` 中配置 Shiki 主题
- 可能需要使用 CSS 变量来动态切换代码块样式

## Decision (ADR-lite)

**Context**: 代码块当前固定使用深色背景，在浅色模式下不协调。需要配置 Shiki 双主题让代码块跟随主题切换。

**Decision**: 使用 **One 主题组合** - `one-light` + `one-dark-pro`

**理由**:
- 色彩丰富，语法高亮区分度高
- Atom 编辑器经典主题，用户熟悉度高
- 配色鲜明，适合技术博客

**实现方式**: 
- 在 `astro.config.mjs` 中配置 Shiki `themes: { light: 'one-light', dark: 'one-dark-pro' }`
- 移除 `global.css` 中硬编码的 `#1e1e1e` 背景色
- 添加 CSS 规则让代码块跟随 `html.dark` 类名切换

**Consequences**:
- 需要修改现有 CSS，移除硬编码颜色
- 需要使用 `!important` 覆盖 Shiki 的内联样式
- 构建时间几乎无影响（<100ms）
- 输出体积每个代码块增加约 3-5KB（可接受）

## Open Questions

## Requirements (evolving)

### 功能需求
- [x] **主题选择**：One Light + One Dark Pro
- [ ] 浅色模式下，代码块使用 `one-light` 主题
- [ ] 深色模式下，代码块使用 `one-dark-pro` 主题
- [ ] 主题切换时代码块颜色跟随变化
- [ ] 行内代码 `<code>` 也需要跟随主题（当前已有样式，保持不变）

### 实现细节（基于研究）
- [ ] 在 `astro.config.mjs` 中添加 Shiki 双主题配置
- [ ] 移除 `src/styles/global.css` 第 126-135 行的硬编码背景色
- [ ] 添加 CSS 规则：`.astro-code` 使用 Shiki CSS 变量
- [ ] 添加 `html.dark .astro-code` 规则切换到深色主题变量
- [ ] 使用 `!important` 覆盖 Shiki 内联样式

### 非功能需求
- [ ] 不影响构建性能（预期增加 <100ms）
- [ ] 语法高亮配色美观易读
- [ ] 兼容现有的代码块功能（复制按钮、换行切换）
- [ ] 保持代码块的 padding、border-radius 等样式

## Acceptance Criteria (evolving)

- [ ] 切换到浅色模式，代码块显示浅色背景
- [ ] 切换到深色模式，代码块显示深色背景
- [ ] 语法高亮颜色跟随主题变化
- [ ] 行内代码也跟随主题变化
- [ ] 现有功能（复制、换行）不受影响

## Definition of Done (team quality bar)

- 代码实现符合需求
- 构建测试通过
- 在浅色/深色模式下测试通过
- 用户预览满意

## Out of Scope (explicit)

- 用户自定义代码主题选择
- 更多语言的语法高亮支持（Shiki 已支持大部分）
- 代码块行号显示
- 代码块标题/文件名显示

## Technical Approach

### 实现步骤

**1. 配置 Astro Shiki 双主题（`astro.config.mjs`）**

```javascript
export default defineConfig({
  // ... 其他配置
  markdown: {
    remarkPlugins: [remarkGfm],
    shikiConfig: {
      themes: {
        light: 'one-light',
        dark: 'one-dark-pro',
      },
    },
  },
});
```

**2. 修改代码块样式（`src/styles/global.css`）**

移除硬编码背景色（第 126-135 行）：
```css
/* 旧代码 - 删除 */
.prose pre {
  background-color: #1e1e1e;  /* ❌ 硬编码深色背景 */
  color: #d4d4d4;
}
```

替换为 Shiki CSS 变量：
```css
/* 新代码 - 使用 Shiki 变量 */
.prose .astro-code {
  padding: 1.25rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  margin-top: 1.5em;
  margin-bottom: 2em;
  
  /* 浅色主题（默认） */
  background-color: var(--shiki-light-bg) !important;
  color: var(--shiki-light) !important;
}

/* 深色主题 */
html.dark .prose .astro-code {
  background-color: var(--shiki-dark-bg) !important;
  color: var(--shiki-dark) !important;
}

/* 代码块内的 span 元素也需要跟随主题 */
html.dark .prose .astro-code span {
  color: var(--shiki-dark) !important;
}
```

**3. 保留现有功能**
- 复制按钮、换行按钮的样式保持不变
- `font-family: var(--font-mono)` 保持不变
- 行内代码样式保持不变

### 关键技术点

1. **为什么用 `!important`？**
   - Shiki 生成的 HTML 有内联样式 `style="color: #xxx"`
   - CSS 变量无法直接覆盖内联样式
   - 必须用 `!important` 强制覆盖

2. **为什么用 `.astro-code` 而不是 `pre`？**
   - Astro 编译后代码块的类名是 `.astro-code`，不是 `.shiki`
   - 选择器更精确，不会影响其他 `<pre>` 元素

3. **CSS 变量说明**
   - `--shiki-light-bg` / `--shiki-light`：浅色主题背景色和文字色
   - `--shiki-dark-bg` / `--shiki-dark`：深色主题背景色和文字色
   - Shiki 自动生成这些变量

## Technical Notes

### 相关文件
- `astro.config.mjs` - Astro 配置，需要添加 Shiki 主题配置
- `src/styles/global.css` - 代码块样式，可能需要调整
- 博客文章 Markdown 文件（不需要修改）

### Shiki 主题推荐
浅色：`github-light`, `min-light`, `one-light`
深色：`github-dark`, `one-dark-pro`, `dracula`
