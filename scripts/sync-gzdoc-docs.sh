#!/bin/bash
# 同步 gzDoc 文档到 blog 站点
# 使用方法: ./sync-gzdoc-docs.sh
#
# ⚠️ 已废弃（DEPRECATED）——请勿使用本脚本！
#
# 本脚本存在严重缺陷：
#   1. 清理逻辑会删除站点独有的 index.md / getting-started.md / architecture/overview.md；
#   2. 同步后会产生双标题；3. 路径硬编码在旧机器；4. 会同步内部文档。
#
# 请改用 gzDoc 仓库内的权威脚本：
#   gzDoc/scripts/sync-docs-to-site.sh [--dry-run]
#
echo "❌ 本脚本已废弃，请使用 gzDoc 仓库内的 scripts/sync-docs-to-site.sh" >&2
echo "   用法: <gzDoc>/scripts/sync-docs-to-site.sh [--dry-run] [--site <门户站路径>]" >&2
exit 1

set -e

BLOG_ROOT="/Users/adam/Documents/WebStormProject/blog"
GZDOC_REPO="git@github.com:GeezCo/gzDoc.git"
DOCS_PREFIX="src/content/docs/gzDoc"

echo "🔄 同步 gzDoc 文档..."

cd "$BLOG_ROOT"

# 更新 subtree
echo "📥 从 gzDoc 仓库拉取最新文档..."
git subtree pull --prefix="$DOCS_PREFIX" "$GZDOC_REPO" main --squash

# 只保留 docs 目录
echo "🧹 清理非文档文件..."
cd "$BLOG_ROOT/$DOCS_PREFIX"

# 保留 docs 目录，删除其他内容
find . -maxdepth 1 ! -name '.' ! -name '..' ! -name 'docs' -exec rm -rf {} + 2>/dev/null || true

# 将 docs 子目录的内容移到当前目录
if [ -d "docs" ]; then
    mv docs/* . 2>/dev/null || true
    rmdir docs 2>/dev/null || true
fi

cd "$BLOG_ROOT"

# 提交更改
if [[ -n $(git status -s) ]]; then
    echo "💾 提交文档更新..."
    git add "$DOCS_PREFIX"
    git commit -m "docs: 同步 gzDoc 文档 ($(date '+%Y-%m-%d %H:%M'))"
    echo "✅ 文档同步完成！"
else
    echo "✅ 文档已是最新，无需更新"
fi
