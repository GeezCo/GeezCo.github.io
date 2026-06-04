# 修复代码块复制按钮显示问题

## Goal

修复博客文章页面代码块的复制按钮无法显示的问题。用户悬浮在代码块上时，应该看到右上角的复制按钮。

## What I already know

* 复制按钮已实现在 `src/layouts/PostLayout.astro` 中
* 按钮默认 `opacity: 0`，预期在悬浮代码块时显示
* CSS 选择器 `:global(pre:hover .copy-btn)` 有误
* 问题：选择器写成了后代选择器，但 `.copy-btn` 是 `pre` 的直接子元素
* 正确选择器应该是 `:global(pre:hover) .copy-btn` 或 `:global(pre):hover .copy-btn`

## Root Cause

**文件**: `src/layouts/PostLayout.astro:201`

```css
/* 错误的选择器 */
:global(pre:hover .copy-btn) {
  opacity: 1;
}
```

这个选择器的语义是："当 `pre:hover .copy-btn` 这个全局选择器匹配时"，但 `:global()` 内部不应该包含 scoped 类名 `.copy-btn`。

正确的写法应该是：
- 方案 A: `:global(pre:hover) .copy-btn` — `pre:hover` 是全局的，`.copy-btn` 是 scoped 的
- 方案 B: `:global(pre):hover .copy-btn` — 同样效果

## Requirements

* 修复 CSS 选择器，使悬浮代码块时按钮可见
* 保持其他样式和交互逻辑不变

## Acceptance Criteria

* [ ] 悬浮代码块时，右上角复制按钮从透明变为可见
* [ ] 点击按钮可以复制代码
* [ ] 复制后按钮显示绿色对勾图标
* [ ] 深色模式下样式正常

## Technical Approach

修改 `src/layouts/PostLayout.astro` 第 201 行：

```css
/* 修改前 */
:global(pre:hover .copy-btn) {
  opacity: 1;
}

/* 修改后 */
:global(pre:hover) .copy-btn {
  opacity: 1;
}
```

## Out of Scope

* 不改变按钮的其他样式
* 不修改复制逻辑
* 不添加新功能
