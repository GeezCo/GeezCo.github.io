# brainstorm: 圆形漏洞扩散主题切换动画

## Goal

实现一个视觉上令人愉悦的主题切换动画：从点击位置开始，像一个圆形"漏洞"逐渐扩大，逐步展示新主题样式。在波纹未扫过的区域，用户仍能看到旧主题样式，避免全局瞬间黑屏/白屏。

## What I already know

### 用户的核心诉求
- 点击后从点击位置扩散一个圆形"漏洞"
- 漏洞内显示新主题，漏洞外保持旧主题
- 像"浪花冲刷"一样逐步改变
- **关键要求**：点击后不能有全局黑屏或白屏的瞬间
- 内容在整个过程中都应该可见

### 当前实现的问题
从最近的代码修改来看，已经尝试过三种方案：

1. **方案 1：纯色遮罩 + mix-blend-mode**
   - 问题：波纹扫过时内容被遮挡，看不清楚

2. **方案 2：View Transitions API + clip-path**
   - 问题：有默认淡入淡出动画，导致双重动画效果
   - 问题：点击瞬间整个屏幕内容消失（这正是用户最不满意的）

3. **方案 3：波纹边框分割线**
   - 当前实现：点击瞬间立即切换主题，只展示一个蓝色圆形边框扩散
   - 问题：不符合需求——用户要的是"漏洞内新主题，漏洞外旧主题"的渐进效果

### 技术约束
- 文件位置：`src/components/ThemeToggle.astro`
- 主题切换通过 `html.classList.toggle('dark')` 实现
- 需要兼容不支持新 API 的浏览器
- 当前动画时长：1500ms（开发调试用，最终需调整为 600ms）

## Assumptions (temporary)

- 用户期望的效果类似于 iOS 深色模式切换的"圆形擦除"动画
- 需要真正的"双缓冲"效果：同时显示新旧两个主题状态
- 可能需要对整个页面进行截图/快照来实现平滑过渡

## Technical Approach

### 核心实现步骤

**1. CSS 配置（src/components/ThemeToggle.astro）**
```css
/* 禁用 View Transitions 默认动画 */
::view-transition-old(root),
::view-transition-new(root) {
  animation: none;
  opacity: 1;
  mix-blend-mode: normal;
}

/* 圆形展开动画 */
::view-transition-new(root) {
  animation: reveal-circular var(--transition-duration, 600ms) ease-in-out;
}

@keyframes reveal-circular {
  from {
    clip-path: circle(0px at var(--x) var(--y));
  }
  to {
    clip-path: circle(var(--r) at var(--x) var(--y));
  }
}

/* 尊重用户的减少动画偏好 */
@media (prefers-reduced-motion: reduce) {
  ::view-transition-new(root) {
    animation: none;
  }
}
```

**2. JavaScript 逻辑**
```javascript
let isTransitioning = false; // 防止快速连续点击

toggle.addEventListener('click', (e) => {
  // 防护：动画进行中时忽略点击
  if (isTransitioning) return;
  
  // 检查 reduced-motion 偏好
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  // 检查 API 支持
  if (!document.startViewTransition || prefersReducedMotion) {
    // 降级：直接切换
    toggleTheme();
    return;
  }
  
  // 设置 CSS 变量
  const x = e.clientX;
  const y = e.clientY;
  const radius = Math.sqrt(
    Math.max(x, window.innerWidth - x) ** 2 +
    Math.max(y, window.innerHeight - y) ** 2
  );
  
  document.documentElement.style.setProperty('--x', `${x}px`);
  document.documentElement.style.setProperty('--y', `${y}px`);
  document.documentElement.style.setProperty('--r', `${radius}px`);
  
  // 启动过渡
  isTransitioning = true;
  const transition = document.startViewTransition(() => {
    toggleTheme();
  });
  
  transition.finished.finally(() => {
    isTransitioning = false;
  });
});

// 系统偏好变化时不播放动画
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  if (!localStorage.getItem('theme')) {
    toggleTheme(); // 直接切换，无动画
  }
});

function toggleTheme() {
  html.classList.toggle('dark');
  const isDark = html.classList.contains('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  window.dispatchEvent(new CustomEvent('theme-change', { detail: { theme: isDark ? 'dark' : 'light' } }));
}
```

**3. 清理工作**
- 移除当前代码中的 `rippleContainer`/`ripple` DOM 创建逻辑
- 移除装饰性边框的 CSS

### 关键决策

1. **API 选择**：View Transitions API（Chrome 111+）
2. **视觉效果**：纯净圆形擦除，无额外装饰
3. **鲁棒性**：快速点击防护 + reduced-motion 检测 + API 降级
4. **扩展性**：CSS 变量控制动画参数

## Decision (ADR-lite)

**Context**: 需要实现圆形"漏洞"扩散效果，漏洞内显示新主题，漏洞外保持旧主题。之前的尝试（纯色遮罩、简单 VT API 使用）都导致内容不可见或全局闪烁。

**Decision**: 使用 **View Transitions API + 自定义 clip-path** 方案

**理由**:
- 性能最优（浏览器原生优化，无需截图）
- 之前失败是因为没有正确配置（禁用默认动画 + 正确的 clip-path）
- 代码相对简洁
- 不支持的浏览器可以降级为瞬时切换

**Consequences**:
- 仅支持 Chrome 111+、Edge 111+（约 80% 用户）
- 需要为不支持的浏览器提供降级方案
- 需要正确配置 CSS 以避免默认动画干扰

## Open Questions

## Requirements (evolving)

### 功能需求
- [ ] 点击主题按钮触发动画
- [ ] 从点击位置 (clientX, clientY) 开始扩散
- [ ] 圆形边界内显示新主题，边界外显示旧主题
- [ ] **纯净的圆形擦除效果**（无额外装饰边框）
- [ ] 扩散速度可调（当前 1500ms 开发模式，最终 600ms）
- [ ] 整个过程中内容清晰可见，无黑屏/白屏

### 实现细节（基于研究）
- [ ] 使用 CSS 变量传递点击坐标 (`--x`, `--y`, `--r`)
- [ ] 使用 CSS 变量控制动画时长 (`--transition-duration`，默认 600ms）
- [ ] 完全禁用 View Transitions 默认动画（`animation: none` + `opacity: 1`）
- [ ] 仅对 `::view-transition-new(root)` 应用 clip-path 动画
- [ ] 旧视图 (`::view-transition-old(root)`) 保持静态显示
- [ ] 计算精确半径确保圆形覆盖整个视口
- [ ] 检测 API 支持，不支持时降级为瞬时切换
- [ ] 移除当前代码中的装饰性边框元素（rippleContainer/ripple）

### 鲁棒性处理
- [ ] **快速连续点击防护**：动画进行中时禁用按钮或取消上一个动画
- [ ] **无障碍支持**：检测 `prefers-reduced-motion`，启用时跳过动画
- [ ] **系统偏好自动切换**：监听 `prefers-color-scheme` 变化时不播放动画（无点击位置）
- [ ] **降级方案**：不支持 View Transitions API 时瞬时切换

### 非功能需求
- [ ] 不支持的浏览器降级为瞬时切换（无动画）
- [ ] 性能良好，不阻塞 UI 交互
- [ ] 内存使用合理
- [ ] 动画流畅（60fps）

## Acceptance Criteria (evolving)

- [ ] 点击切换按钮，从点击位置开始圆形扩散
- [ ] 圆形边界清晰，边界内是新主题色彩，边界外是旧主题色彩
- [ ] 扩散完成后，整个页面完全变为新主题
- [ ] 在动画过程中，页面内容（文字、图片）始终可见可读
- [ ] 无全局闪烁、黑屏、白屏现象
- [ ] 动画流畅，至少 30fps
- [ ] 快速连续点击时不会出现多个动画叠加或错误状态
- [ ] 启用 `prefers-reduced-motion` 时跳过动画，直接切换主题
- [ ] 系统偏好自动切换时不播放动画
- [ ] 不支持 View Transitions API 的浏览器能正常降级
- [ ] 在 Chrome/Safari/Firefox 主流浏览器测试通过

## Definition of Done (team quality bar)

- 代码实现符合需求，动画效果达到预期
- 通过 `npm run build` 构建测试
- 在 Chrome/Safari/Firefox 主流浏览器测试通过
- 不支持的浏览器能正常降级
- 用户在本地预览满意后明确同意提交

## Out of Scope (explicit)

- 其他页面切换动画（仅限主题切换）
- 复杂的 3D 效果或粒子效果
- 动画时长的 UI 配置选项（使用 CSS 变量，但不暴露给用户）
- 非圆形的其他形状（方形、菱形等）
- 多主题支持（当前只有 light/dark 两种）
- 动画播放进度指示器
- 声音效果

## Technical Notes

### 研究发现
详见 [`research/view-transitions-api.md`](research/view-transitions-api.md)

**之前失败的根本原因：**
View Transitions API 默认有交叉淡入淡出动画（opacity 变化），导致：
- 点击瞬间内容透明度变化（看起来像黑屏/白屏）
- 双重动画效果（淡入淡出 + clip-path）
- 内容可见性问题

**正确实现模式：**
```css
/* 关键：完全禁用默认交叉淡入淡出 */
::view-transition-old(root),
::view-transition-new(root) {
  animation: none;
  opacity: 1;
  mix-blend-mode: normal;
}

/* 仅对新状态应用圆形展开 */
::view-transition-new(root) {
  animation: reveal-circular 600ms ease-in-out;
}

@keyframes reveal-circular {
  from {
    clip-path: circle(0px at var(--x) var(--y));
  }
  to {
    clip-path: circle(var(--r) at var(--x) var(--y));
  }
}
```

**JavaScript 模式：**
```javascript
// 捕获点击位置到 CSS 变量
document.documentElement.style.setProperty('--x', `${e.clientX}px`);
document.documentElement.style.setProperty('--y', `${e.clientY}px`);
document.documentElement.style.setProperty('--r', `${radius}px`);

// 启动过渡
document.startViewTransition(() => {
  document.documentElement.classList.toggle('dark');
});
```

### 类似效果参考
- iOS 深色模式切换的圆形擦除动画
- Material Design 的 Circular Reveal 效果
- macOS 暗色模式切换的淡入效果（但我们需要圆形，不是全局淡入）

### 相关文件
- `src/components/ThemeToggle.astro` - 主题切换按钮和逻辑
- `src/styles/global.css` - 全局主题样式定义
