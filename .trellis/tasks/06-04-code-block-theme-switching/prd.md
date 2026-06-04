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
- [x] 浅色模式下，代码块使用 `one-light` 主题
- [x] 深色模式下，代码块使用 `one-dark-pro` 主题
- [x] 主题切换时代码块颜色跟随变化
- [x] 行内代码 `<code>` 也需要跟随主题（当前已有样式，保持不变）
- [x] **纯文本代码块后备样式**：无语言标记的代码块也能正确显示

### 实现细节（基于研究）
- [x] 在 `astro.config.mjs` 中添加 Shiki 双主题配置
- [x] 移除 `src/styles/global.css` 第 126-135 行的硬编码背景色
- [x] 添加 CSS 规则：`.astro-code` 使用 Shiki CSS 变量
- [x] 添加 `html.dark .astro-code` 规则切换到深色主题变量
- [x] 使用 `!important` 覆盖 Shiki 内联样式
- [x] **添加 CSS 变量后备值**：确保纯文本代码块也有视觉区分

### 非功能需求
- [x] 不影响构建性能（实际增加 <100ms）
- [x] 语法高亮配色美观易读
- [x] 兼容现有的代码块功能（复制按钮、换行切换）
- [x] 保持代码块的 padding、border-radius 等样式

## Acceptance Criteria (evolving)

- [x] 切换到浅色模式，代码块显示浅色背景
- [x] 切换到深色模式，代码块显示深色背景
- [x] 语法高亮颜色跟随主题变化
- [x] 行内代码也跟随主题变化
- [x] 现有功能（复制、换行）不受影响
- [x] **纯文本代码块有后备样式**（灰色背景 + 边框）

## Definition of Done (team quality bar)

- [x] 代码实现符合需求
- [x] 构建测试通过
- [x] 在浅色/深色模式下测试通过
- [x] 用户预览满意
- [x] Git 冲突标记已清理

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
- `astro.config.mjs` - Astro 配置，已添加 Shiki 主题配置
- `src/styles/global.css` - 代码块样式，已调整为使用 CSS 变量
- 博客文章 Markdown 文件（不需要修改）

### Shiki 主题推荐
浅色：`github-light`, `min-light`, `one-light`
深色：`github-dark`, `one-dark-pro`, `dracula`

### 实现总结

**提交历史**：
1. `feat: 配置 Astro Shiki 双主题` - 在 astro.config.mjs 添加 themes 配置
2. `style: 优化代码块样式，添加后备方案` - 添加 CSS 变量和后备样式
3. `fix: 解决 Git 合并冲突标记` - 清理冲突标记

**关键发现**：

1. **纯文本代码块问题**
   - **问题**：289 个代码块没有语言标记（空的 ` ``` `），Shiki 不会为它们生成语法高亮
   - **症状**：浅色模式下纯黑文字 + 白背景，无边框，难以区分正文
   - **根本原因**：Shiki 只为有语法的代码生成 CSS 变量，纯文本代码块没有这些变量
   - **解决方案**：使用 CSS 变量后备值 `var(--shiki-light-bg, #f6f8fa)`
   - **效果**：有语法高亮的代码块使用 Shiki 变量，纯文本代码块使用后备值

2. **CSS 变量后备值的重要性**
   ```css
   /* 关键技术：CSS 变量后备值 */
   color: var(--shiki-light, #24292f) !important;
   background-color: var(--shiki-light-bg, #f6f8fa) !important;
   ```
   - 如果 Shiki 变量存在 → 使用变量（彩色语法高亮）
   - 如果变量不存在 → 使用后备值（灰色背景）

3. **边框增强视觉区分**
   ```css
   border: 1px solid #d0d7de;  /* 浅色模式 */
   border: 1px solid #30363d;  /* 深色模式 */
   ```
   - 即使没有语法高亮，也能通过边框明确区分代码块和正文

4. **GitHub 风格配色选择**
   - 浅色背景：`#f6f8fa` (GitHub 代码块背景)
   - 浅色边框：`#d0d7de`
   - 深色背景：`#1e1e1e` (保持原有深色)
   - 深色边框：`#30363d`
   - 理由：GitHub 风格用户熟悉度高，配色平衡

### 常见陷阱

1. **只配置 Shiki 不添加后备样式**
   - ❌ 错误：以为配置了双主题就能解决所有代码块的问题
   - ✅ 正确：纯文本代码块需要 CSS 后备样式

2. **忘记使用 `!important`**
   - ❌ 错误：CSS 变量无法覆盖 Shiki 的内联样式
   - ✅ 正确：必须使用 `!important` 强制覆盖

3. **选择器错误**
   - ❌ 错误：使用 `.prose pre` 或 `.shiki`
   - ✅ 正确：Astro 编译后的类名是 `.astro-code`

### 设计权衡

**为什么选择 CSS 变量后备值而不是批量添加语言标记？**

| 方案 | 优点 | 缺点 |
|------|------|------|
| CSS 后备值 | 快速修复，一劳永逸，写文章时不用考虑 | 纯文本代码块只有单色 |
| 批量添加语言标记 | 所有代码块都有语法高亮 | 工作量大（289个），容易出错，后续维护成本高 |

**决策**：选择 CSS 后备值方案
- 用户明确表示"需要一劳永逸，写文章时不用考虑"
- 纯文本代码块（如配置示例、日志输出）本身不需要语法高亮
- 通过边框和背景色已经能明显区分代码块和正文
