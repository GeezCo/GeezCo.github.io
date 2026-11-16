# 文档更新指南

本仓库为 monorepo，门户网站与 GzDoc 平台代码、文档都在同一个仓库里，**不再需要跨仓库同步**。

## 文档分两处

| 位置 | 用途 | 是否公开到站点 |
|------|------|----------------|
| `site/src/content/docs/gzDoc/` | 对外展示的文档中心 | ✅ 会构建进站点 |
| `docs/` | 项目内部文档（架构评审、路线图、协作指南等）| ❌ 不展示 |

## 更新「公开文档中心」内容

公开文档在 `site/src/content/docs/gzDoc/` 下，直接编辑对应 `.md` 文件即可。每个文件顶部需要 frontmatter：

```markdown
---
title: 标题
description: 描述
order: 排序号
---
```

编辑后本地预览、提交、推送：

```bash
cd site
npm run dev          # http://localhost:4321/doc/gzDoc/ 预览

# 确认无误后
cd ..
git add site/src/content/docs/gzDoc
git commit -m "docs: 更新 XXX 文档"
git push origin main   # push 且改动 site/ 会自动触发 Pages 部署
```

## 更新「内部文档」

内部文档在 `docs/` 下，直接编辑即可，**不会**出现在网站上：

```bash
vim docs/architecture/README.md
git add docs/ && git commit -m "docs: 更新架构文档" && git push
```

## 文档访问地址

- **文档首页**: https://geezco.github.io/doc/gzDoc/
- **系统架构**: https://geezco.github.io/doc/gzDoc/architecture/
- **开发指南**: https://geezco.github.io/doc/gzDoc/development/
- **部署指南**: https://geezco.github.io/doc/gzDoc/deployment/
- **工作区指南**: https://geezco.github.io/doc/gzDoc/workspace-guide/

## 注意事项

1. **文档格式**：Markdown（GitHub Flavored Markdown）
2. **图片资源**：放在同级目录，相对路径引用
3. **内部链接**：使用相对路径
4. **双标题**：公开文档正文不要写 `# 标题`，标题由 frontmatter 的 `title` 渲染

## 故障排查

### 构建失败

```bash
cd site
npm run build        # 本地复现构建问题
```

### 文档未更新

push 后检查 GitHub Actions：

```bash
gh run list --limit 3
```

注意：只有改动 `site/` 才会触发 Pages 部署；纯 `docs/` 变更不会重建站点（这是预期行为）。
