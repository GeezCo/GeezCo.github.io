# Research: Astro + Shiki 代码块双主题切换

- **Query**: 研究 Astro + Shiki 如何实现代码块跟随浅色/深色主题自动切换
- **Scope**: External documentation + Internal codebase analysis
- **Date**: 2026-06-04

## 执行摘要

Astro 6.3.7 内置 Shiki 4.1.0 作为语法高亮器。Shiki 支持双主题配置，通过 CSS 变量存储颜色，配合 `.dark` 类名即可实现主题自动切换。

**当前项目状态**：
- ✅ 已实现深色模式切换（`html.dark` 类名切换）
- ✅ 已有代码块复制/换行功能
- ❌ 代码块未配置双主题（当前硬编码为深色背景）

## Findings

### 1. Astro Shiki 配置方式

#### 1.1 基础配置结构

在 `astro.config.mjs` 中通过 `markdown.shikiConfig` 配置：

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';

export default defineConfig({
  markdown: {
    shikiConfig: {
      // 单主题配置
      theme: 'dracula',
      
      // 或双主题配置
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
    },
  },
});
```

#### 1.2 支持的配置选项

| 配置项 | 类型 | 说明 |
|--------|------|------|
| `theme` | `string` | 单主题名称（与 `themes` 互斥） |
| `themes` | `{ light: string, dark: string }` | 双主题配置 |
| `defaultColor` | `string \| false` | 默认颜色模式，可选 `'light'`、`'dark'`、`false` |
| `wrap` | `boolean` | 是否自动换行 |
| `transformers` | `ShikiTransformer[]` | 自定义转换器 |

**来源**: [Astro 官方文档 - Syntax Highlighting](https://docs.astro.build/en/guides/syntax-highlighting/)

---

### 2. 双主题实现方案

#### 2.1 Shiki 的 `themes` 选项工作原理

Shiki 的双主题方案基于 **CSS 变量** 实现：

1. 配置 `themes: { light: 'xxx', dark: 'yyy' }` 后
2. Shiki 生成的 HTML 包含双份颜色信息：
   - `color: <light-color>` — 浅色主题颜色（直接样式）
   - `--shiki-dark: <dark-color>` — 深色主题颜色（CSS 变量）
   - `background-color: <light-bg>`
   - `--shiki-dark-bg: <dark-bg>`

#### 2.2 生成的 HTML 结构示例

```html
<pre
  class="shiki shiki-themes github-light github-dark"
  style="background-color:#ffffff;--shiki-dark-bg:#0d1117;color:#24292f;--shiki-dark:#e6edf3"
  tabindex="0"
>
  <code>
    <span class="line">
      <span style="color:#cf222e;--shiki-dark:#ff7b72">const</span>
      <span style="color:#0550ae;--shiki-dark:#79c0ff"> foo</span>
      <span style="color:#cf222e;--shiki-dark:#ff7b72"> =</span>
      <span style="color:#0a3069;--shiki-dark:#a5d6ff"> 'bar'</span>
      <span style="color:#24292f;--shiki-dark:#e6edf3">;</span>
    </span>
  </code>
</pre>
```

**关键点**：
- 每个 token 的 `<span>` 都有 `color` 和 `--shiki-dark` 两个属性
- 默认显示浅色主题（`color` 生效）
- 通过 CSS 规则让深色主题生效（覆盖为 `var(--shiki-dark)`）

---

### 3. CSS 集成方式

#### 3.1 Class-based 深色模式（推荐，匹配当前项目）

当前项目使用 `html.dark` 类名切换主题，应使用以下 CSS：

```css
/* 深色模式下，代码块使用 CSS 变量中的深色主题颜色 */
html.dark .astro-code,
html.dark .astro-code span {
  color: var(--shiki-dark) !important;
  background-color: var(--shiki-dark-bg) !important;
  /* 可选：字体样式 */
  font-style: var(--shiki-dark-font-style) !important;
  font-weight: var(--shiki-dark-font-weight) !important;
  text-decoration: var(--shiki-dark-text-decoration) !important;
}
```

**注意**：
- Astro 生成的代码块使用 `.astro-code` 类名，而非 Shiki 原生的 `.shiki`
- 需要同时覆盖 `<pre>` 和 `<span>` 的颜色

#### 3.2 Query-based 深色模式（备选方案）

如果使用媒体查询检测系统偏好：

```css
@media (prefers-color-scheme: dark) {
  .astro-code,
  .astro-code span {
    color: var(--shiki-dark) !important;
    background-color: var(--shiki-dark-bg) !important;
  }
}
```

#### 3.3 当前项目的问题

**现状**（`src/styles/global.css` line 126-135）：

```css
/* 代码块 - 深色背景 */
.prose pre {
  background-color: #1e1e1e;  /* ❌ 硬编码深色背景 */
  padding: 1.25rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  font-family: var(--font-mono);
  color: #d4d4d4;  /* ❌ 硬编码浅灰色文字 */
  margin-top: 1.5em;
  margin-bottom: 2em;
}
```

**问题**：
- 浅色模式下代码块仍然是深色背景（不跟随主题）
- 未使用 Shiki 的语法高亮（纯色文本）

---

### 4. 推荐的主题组合

#### 4.1 GitHub 主题组合（最流行）

```js
themes: {
  light: 'github-light',
  dark: 'github-dark',
}
```

**优点**：
- ✅ 最流行的组合，用户熟悉度高
- ✅ 对比度适中，长时间阅读不累
- ✅ 支持大量编程语言
- ✅ 与 GitHub 代码展示一致

#### 4.2 其他推荐组合

| 浅色主题 | 深色主题 | 特点 |
|---------|---------|------|
| `github-light` | `github-dark` | 默认推荐，最平衡 |
| `min-light` | `nord` | 简约风格 |
| `vitesse-light` | `vitesse-dark` | 现代感强 |
| `catppuccin-latte` | `catppuccin-mocha` | 柔和色调 |
| `one-light` | `one-dark-pro` | Atom 编辑器风格 |

**查看所有主题**：https://shiki.style/themes

#### 4.3 主题选择建议

根据当前项目设计风格（Stripe 风格 + 紫色主题）：

**推荐 1**：`github-light` + `github-dark`（稳妥选择）
**推荐 2**：`vitesse-light` + `vitesse-dark`（更现代）

---

### 5. 常见陷阱与注意事项

#### 5.1 性能影响

**构建时间**：
- ❌ 不会显著增加构建时间（Shiki 在构建时生成 HTML）
- ✅ 双主题配置只是多输出一些 CSS 变量，几乎无性能损耗

**输出体积**：
- 每个 `<span>` 增加约 30-50 字节（CSS 变量）
- 假设一个代码块有 100 个 token，增加约 3-5KB
- 对于博客文章（20+ 代码块），总增量约 100KB（可接受）

#### 5.2 与现有 CSS 样式冲突

**潜在冲突点**：
1. `.prose pre` 硬编码背景色会覆盖 Shiki 生成的背景
2. `.prose pre code` 硬编码文字颜色会覆盖语法高亮

**解决方案**：
- 删除 `.prose pre` 的硬编码颜色
- 改用 Shiki 生成的内联样式 + CSS 变量

#### 5.3 `!important` 的必要性

根据 Shiki 官方文档，**必须使用 `!important`**：

```css
/* ✅ 正确 */
html.dark .astro-code span {
  color: var(--shiki-dark) !important;
}

/* ❌ 错误 - 优先级不足，无法覆盖内联样式 */
html.dark .astro-code span {
  color: var(--shiki-dark);
}
```

**原因**：Shiki 在每个 `<span>` 上使用内联 `style="color:..."`，CSS 规则需要 `!important` 才能覆盖。

#### 5.4 Astro 特定注意事项

| Shiki 文档示例 | Astro 项目实际用法 | 说明 |
|----------------|-------------------|------|
| `.shiki` | `.astro-code` | Astro 改用 `.astro-code` 类名 |
| `--shiki-*` | `--shiki-*` | CSS 变量名保持一致 |
| `codeToHtml()` | `markdown.shikiConfig` | Astro 自动调用 Shiki API |

---

## 实现步骤清单

### Step 1: 配置 Astro Shiki 双主题

编辑 `astro.config.mjs`：

```diff
export default defineConfig({
  site: 'https://geezco.github.io',
  output: 'static',
  integrations: [sitemap()],
  markdown: {
    remarkPlugins: [remarkGfm],
+   shikiConfig: {
+     themes: {
+       light: 'github-light',
+       dark: 'github-dark',
+     },
+   },
  },
});
```

### Step 2: 更新全局 CSS

编辑 `src/styles/global.css`：

**删除**（line 125-141）：
```css
/* 代码块 - 深色背景 */
.prose pre {
  background-color: #1e1e1e;  /* ❌ 删除 */
  /* ... */
  color: #d4d4d4;  /* ❌ 删除 */
}

.prose pre code {
  background: transparent;  /* ❌ 删除 */
  padding: 0;  /* ❌ 删除 */
  color: inherit;  /* ❌ 删除 */
}
```

**替换为**：
```css
/* 代码块 - Shiki 双主题 */
.prose pre.astro-code {
  padding: 1.25rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  font-family: var(--font-mono);
  margin-top: 1.5em;
  margin-bottom: 2em;
}

/* 深色模式 - 使用 Shiki 的 CSS 变量 */
html.dark .astro-code,
html.dark .astro-code span {
  color: var(--shiki-dark) !important;
  background-color: var(--shiki-dark-bg) !important;
}
```

### Step 3: 测试验证

1. 运行 `npm run dev`
2. 打开包含代码块的文章（如 `/blog/genetic-algorithm`）
3. 切换浅色/深色主题，确认代码块颜色跟随切换
4. 检查语法高亮是否正常（关键字、字符串、注释等有不同颜色）

### Step 4: 兼容性处理（可选）

如果发现代码块按钮（复制/换行）被遮挡，调整 `z-index`：

```css
[data-copy-btn],
[data-wrap-btn] {
  z-index: 10;  /* 确保按钮在代码块上方 */
}
```

---

## 参考链接

### 官方文档
1. [Astro - Syntax Highlighting](https://docs.astro.build/en/guides/syntax-highlighting/)
2. [Shiki - Dual Themes Guide](https://shiki.style/guide/dual-themes)
3. [Shiki - Theme Collections](https://shiki.style/themes)
4. [Shiki - GitHub Repository](https://github.com/shikijs/shiki)

### 相关规范
- [CSS `light-dark()` 函数兼容性](https://caniuse.com/?search=css-light-dark)
- [CSS 自定义属性（变量）](https://developer.mozilla.org/zh-CN/docs/Web/CSS/--*)

---

## 相关 Spec 文档

- `.trellis/spec/frontend/` — 待创建前端规范（建议记录主题切换模式）

---

## Caveats / 未解决问题

1. **行内代码 (`<code>`)** — 当前研究仅覆盖代码块 (`<pre><code>`)，行内代码的深色模式样式需单独处理（已有 `html.dark .prose :not(pre) > code` 规则，无需修改）

2. **自定义主题** — 如果未来需要完全自定义配色，可导入 JSON 主题文件：
   ```js
   import customTheme from './my-shiki-theme.json';
   shikiConfig: { theme: customTheme }
   ```

3. **Shiki 升级** — Shiki 5.x 可能有 breaking changes，当前锁定 4.1.0（Astro 6.3.7 内置）

4. **构建缓存** — 修改 `astro.config.mjs` 后需清理缓存：
   ```bash
   rm -rf .astro dist
   npm run build
   ```
