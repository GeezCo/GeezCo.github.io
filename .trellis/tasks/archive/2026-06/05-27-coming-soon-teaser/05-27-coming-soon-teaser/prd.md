# 添加即将上线功能预告框

## Goal

在工具列表页面（`/tools/`）的现有工具卡片后面，添加一个半透明灰色的"即将上线"预告框，用于展示正在开发中的功能。这个框应该具有"呼之欲出"的视觉效果，暗示新功能即将到来。

**Why**: 
- 为多人协作开发工具提供统一的展示入口
- 让用户提前了解即将上线的功能
- 保持工具列表的视觉一致性

## What I already know

### 当前工具页面结构（`src/pages/tools/index.astro`）

**数据结构：**
```javascript
const tools = [
  {
    name: "Mermaid 图表",
    icon: "📊",
    description: "将 Mermaid 代码转换为 SVG/PNG 图表",
    url: "/tools/mermaid",
    color: "from-blue-500 to-cyan-500"
  },
  // ... 3 个工具
];
```

**布局：**
- Grid 布局：`grid-template-columns: repeat(auto-fit, minmax(280px, 1fr))`
- 卡片样式：白色背景、圆角、阴影、hover 动效
- 响应式：移动端单列显示

**现有样式特点：**
- 卡片：白色背景（深色模式：`rgba(39, 39, 42, 0.7)`）
- 圆角：`1rem`
- 阴影：`0 4px 6px rgba(0, 0, 0, 0.1)`
- Hover：上移 4px + 阴影加深
- 渐变图标背景
- 右下角箭头（`→`）

**配色方案：**
- 浅色模式：白色卡片 + 渐变背景
- 深色模式：半透明灰色卡片

## Assumptions (temporary)

1. **"即将上线"框的数量**：1 个固定框（不是动态列表）
2. **内容**：显示通用提示文案（如"更多工具正在路上..."）
3. **交互**：不可点击（纯展示）
4. **位置**：始终在所有工具卡片的最后

## Open Questions

### ✅ Question 1: 预告框的内容和交互（已确认）

**决策：选项 A - 通用提示文案**

内容：
```
图标：⏳
标题：即将上线
描述：更多实用工具正在开发中，敬请期待...
```

理由：
- 简单、通用，不需要维护具体功能列表
- 适合当前阶段

---

### ✅ Question 2: 视觉效果设计（已确认）

**决策：选项 A - 半透明 + 虚线边框**

样式：
```css
background: rgba(200, 200, 200, 0.3);
border: 2px dashed #d4d4d8;
opacity: 0.7;
```

理由：
- 虚线暗示"未完成/占位"
- 半透明营造"即将出现"的感觉
- 实现简单，性能好
- 符合常见设计语言

---

### 🔴 Blocking Question 3: 多人协作的开发流程

你提到"后期多人开发工具提 PR 都会填入 tools 这个页面"，你希望的协作流程是什么？

**选项 A：直接修改 tools 数组**
```javascript
// PR 作者直接在 tools 数组中添加新工具
const tools = [
  { name: "Mermaid 图表", ... },
  { name: "新工具", ... }, // ← PR 添加这一行
];
```
- ✅ 简单直接
- ❌ 容易产生合并冲突（多个 PR 同时修改同一文件）

**选项 B：独立文件 + 自动聚合**
```
src/data/tools/
  ├── mermaid.json
  ├── svg-convert.json
  └── new-tool.json  ← PR 只需添加新文件
```
```javascript
// index.astro 自动读取所有 JSON
const tools = await Astro.glob('../data/tools/*.json');
```
- ✅ 避免合并冲突
- ✅ 每个工具独立维护
- ⚠️ 需要重构现有代码

**选项 C：保持现状 + 文档说明**
- 在 `README.md` 或 `CONTRIBUTING.md` 中说明如何添加工具
- PR 作者按照文档修改 `tools` 数组
- 维护者负责解决合并冲突
- ✅ 不需要重构
- ❌ 仍然可能有冲突

### ✅ Question 3: 多人协作的开发流程（已确认）

**决策：选项 B - 独立文件 + 自动聚合**

目录结构：
```
src/data/tools/
  ├── mermaid.json
  ├── svg-convert.json
  ├── ascii-art.json
  └── new-tool.json  ← PR 只需添加新文件
```

代码实现：
```javascript
// index.astro 自动读取所有 JSON
const toolFiles = await Astro.glob('../data/tools/*.json');
const tools = toolFiles.map(f => f.default);
```

协作流程：
1. 开发者 fork 仓库
2. 在 `src/data/tools/` 下创建新的 JSON 文件
3. 创建新工具页面（如 `src/pages/tools/my-tool.astro`）
4. 提交 PR

理由：
- 避免合并冲突（每个 PR 只添加新文件）
- 每个工具独立维护
- 适合多人协作

---

## Requirements (已确认)

### 核心需求

1. **预告框实现**
   - [x] 在 `.tools-grid` 中，所有工具卡片的最后
   - [x] 使用相同的 Grid 布局（自动适配响应式）
   - [x] 内容：图标 ⏳ + 标题"即将上线" + 描述"更多实用工具正在开发中，敬请期待..."
   - [x] 视觉效果：半透明灰色背景 + 虚线边框 + 0.7 透明度
   - [x] 交互：不可点击（`cursor: default`）
   - [x] 深色模式适配

2. **代码重构（支持多人协作）**
   - [x] 创建 `src/data/tools/` 目录
   - [x] 将现有 3 个工具迁移到独立 JSON 文件
   - [x] 修改 `index.astro` 使用 `Astro.glob()` 自动读取
   - [x] 保持现有功能和样式不变

3. **文档更新**
   - [x] 在 `README.md` 或 `CONTRIBUTING.md` 中说明如何添加新工具
   - [x] 提供 JSON 文件模板和示例

### JSON 文件格式

```json
{
  "name": "工具名称",
  "icon": "📊",
  "description": "工具描述",
  "url": "/tools/tool-name",
  "color": "from-blue-500 to-cyan-500"
}
```

## Acceptance Criteria

- [x] 预告框显示在所有工具卡片的最后
- [x] 视觉上明显区别于正常工具卡片（半透明、虚线边框）
- [x] 深色模式下样式正常
- [x] 移动端显示正常
- [x] 现有 3 个工具正常显示（迁移后）
- [x] 新增工具只需添加 JSON 文件，无需修改 `index.astro`
- [x] 文档清晰说明添加工具的流程

## Definition of Done

- 代码实现并测试通过
- 浅色/深色模式都正常
- 移动端/桌面端都正常
- 现有 3 个工具迁移到 JSON 文件
- 更新 README/CONTRIBUTING 文档
- 提交到 Git 仓库

## Out of Scope

- 动态从后端获取"即将上线"的功能列表
- 用户可以投票或评论即将上线的功能
- 预告框的点击跳转（当前版本纯展示）
- 工具的排序、分类、搜索功能

## Technical Approach

### 实现步骤

**Step 1: 创建数据目录和 JSON 文件**

```bash
mkdir -p src/data/tools
```

创建 3 个 JSON 文件：
- `src/data/tools/mermaid.json`
- `src/data/tools/svg-convert.json`
- `src/data/tools/ascii-art.json`

**Step 2: 修改 index.astro**

```astro
---
import BaseLayout from "../../layouts/BaseLayout.astro";

// 自动读取所有工具配置
const toolFiles = await Astro.glob('../../data/tools/*.json');
const tools = toolFiles.map(f => f.default);
---

<BaseLayout title="工具箱" description="在线工具集合">
  <section class="tools-index">
    <div class="container">
      <h1>🧰 我的工具箱</h1>
      <p class="subtitle">一些实用的在线小工具</p>

      <div class="tools-grid">
        {tools.map(tool => (
          <a href={tool.url} class="tool-card">
            <div class={`tool-icon bg-gradient-to-br ${tool.color}`}>
              <span>{tool.icon}</span>
            </div>
            <h2>{tool.name}</h2>
            <p>{tool.description}</p>
            <div class="tool-arrow">→</div>
          </a>
        ))}
        
        <!-- 即将上线预告框 -->
        <div class="tool-card coming-soon">
          <div class="tool-icon">
            <span>⏳</span>
          </div>
          <h2>即将上线</h2>
          <p>更多实用工具正在开发中，敬请期待...</p>
        </div>
      </div>
    </div>
  </section>
</BaseLayout>
```

**Step 3: 添加预告框样式**

```css
.coming-soon {
  background: rgba(200, 200, 200, 0.3) !important;
  border: 2px dashed #d4d4d8;
  opacity: 0.7;
  cursor: default;
  pointer-events: none;
}
.coming-soon:hover {
  transform: none;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
.coming-soon .tool-icon {
  background: rgba(156, 163, 175, 0.3) !important;
}
.coming-soon .tool-arrow {
  display: none;
}

:global(html.dark) .coming-soon {
  background: rgba(63, 63, 70, 0.3) !important;
  border-color: #52525b;
}
:global(html.dark) .coming-soon .tool-icon {
  background: rgba(82, 82, 91, 0.3) !important;
}
```

**Step 4: 更新文档**

在 `README.md` 或创建 `CONTRIBUTING.md`，添加：

```markdown
## 如何添加新工具

1. 在 `src/data/tools/` 目录下创建新的 JSON 文件（如 `my-tool.json`）：

\`\`\`json
{
  "name": "我的工具",
  "icon": "🔧",
  "description": "工具描述",
  "url": "/tools/my-tool",
  "color": "from-orange-500 to-red-500"
}
\`\`\`

2. 在 `src/pages/tools/` 目录下创建工具页面（如 `my-tool.astro`）

3. 提交 PR

工具会自动显示在工具列表页面。
```

## Technical Notes

### 文件清单

**新增文件：**
- `src/data/tools/mermaid.json`
- `src/data/tools/svg-convert.json`
- `src/data/tools/ascii-art.json`
- `CONTRIBUTING.md`（或更新 `README.md`）

**修改文件：**
- `src/pages/tools/index.astro`（重构 + 添加预告框）

### Astro.glob() 说明

`Astro.glob()` 是 Astro 的内置功能，用于批量导入文件：
- 支持 glob 模式（如 `*.json`）
- 返回文件数组，每个文件的内容在 `.default` 属性中
- 在构建时执行，无运行时开销

### 迁移风险

- 现有 3 个工具需要迁移到 JSON，确保数据一致
- 测试所有工具链接和样式是否正常

## Decision (ADR-lite)

**Context**: 
- 当前工具配置硬编码在 `index.astro` 中
- 多人协作时，修改同一文件容易产生合并冲突
- 需要添加"即将上线"预告框

**Decision**: 
1. 将工具配置迁移到独立 JSON 文件
2. 使用 `Astro.glob()` 自动读取
3. 添加半透明虚线边框的预告框

**Consequences**: 
- ✅ 避免合并冲突，支持多人协作
- ✅ 每个工具独立维护，易于管理
- ✅ 预告框视觉效果清晰，不干扰现有工具
- ⚠️ 需要一次性迁移现有工具（小工作量）
- ⚠️ 新贡献者需要学习 JSON 文件格式（文档可解决）

### 核心需求

1. **预告框位置**
   - [ ] 在 `.tools-grid` 中，所有工具卡片的最后
   - [ ] 使用相同的 Grid 布局（自动适配响应式）

2. **视觉效果**
   - [ ] 半透明灰色背景
   - [ ] "呼之欲出"的视觉暗示（待明确：虚线/动画/渐变）
   - [ ] 与现有卡片保持一致的尺寸和圆角
   - [ ] 深色模式适配

3. **内容展示**
   - [ ] 图标（待明确：⏳/🚀/🔜）
   - [ ] 标题："即将上线" 或类似文案
   - [ ] 描述文字（待明确：通用/具体/列表）

4. **交互行为**
   - [ ] 不可点击（`cursor: default`）
   - [ ] 无 hover 动效（或轻微动效）

### 现有功能保持

- [ ] 现有 3 个工具卡片不受影响
- [ ] Grid 布局自动适配
- [ ] 响应式布局正常
- [ ] 深色模式正常

## Acceptance Criteria (evolving)

- [ ] 预告框显示在所有工具卡片的最后
- [ ] 视觉上明显区别于正常工具卡片（半透明、虚线等）
- [ ] 深色模式下样式正常
- [ ] 移动端显示正常
- [ ] 不影响现有工具卡片的布局和样式
- [ ] 代码易于维护（多人协作友好）

## Definition of Done (team quality bar)

- 代码实现并测试通过
- 浅色/深色模式都正常
- 移动端/桌面端都正常
- 提交到 Git 仓库
- 如果涉及协作流程，更新 README/CONTRIBUTING 文档

## Out of Scope (explicit)

- 动态从后端获取"即将上线"的功能列表
- 用户可以投票或评论即将上线的功能
- 预告框的点击跳转（当前版本纯展示）

## Technical Notes

### 文件位置
- `src/pages/tools/index.astro`

### 实现方案（草案）

**方案 1：在 tools 数组后添加特殊对象**
```javascript
const tools = [ /* 现有工具 */ ];
const comingSoon = {
  name: "即将上线",
  icon: "⏳",
  description: "更多实用工具正在开发中，敬请期待...",
  isComingSoon: true // 标记为预告框
};
```

**方案 2：独立的 HTML 块**
```astro
<div class="tools-grid">
  {tools.map(tool => <a href={tool.url} class="tool-card">...</a>)}
  
  <!-- 预告框 -->
  <div class="tool-card coming-soon">
    <div class="tool-icon">⏳</div>
    <h2>即将上线</h2>
    <p>更多实用工具正在开发中，敬请期待...</p>
  </div>
</div>
```

### CSS 实现（草案）

```css
.coming-soon {
  background: rgba(200, 200, 200, 0.3) !important;
  border: 2px dashed #d4d4d8;
  opacity: 0.7;
  cursor: default;
  pointer-events: none; /* 禁止点击 */
}
.coming-soon:hover {
  transform: none; /* 禁用 hover 动效 */
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); /* 保持原始阴影 */
}
:global(html.dark) .coming-soon {
  background: rgba(63, 63, 70, 0.3) !important;
  border-color: #52525b;
}
```

## Research References

（暂无需要研究的技术选型）

---

## 下一步

等待回答 3 个 Blocking Questions，然后继续细化需求。
