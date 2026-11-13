#!/usr/bin/env bash
#
# sync-docs-to-site.sh
#
# 将 gzDoc 仓库中「适合公开」的白名单文档同步到 GeezCo.github.io 门户站的
# src/content/docs/gzDoc/ 目录。
#
# 设计原则（相比旧的 sync-gzdoc-docs.sh 修复了以下问题）：
#   1. 白名单机制：只同步明确列出、适合公开的文档，避免内部评审/路线图外泄。
#   2. 不删除站点任何文件：绝不清理目录，站点独有的 index.md / getting-started.md /
#      architecture/overview.md 始终保留。
#   3. 单标题：剥离 Markdown 首行的 `# 标题`，改用 frontmatter 的 title 渲染，避免双标题。
#   4. 幂等：重复执行不会产生重复 frontmatter 或累积改动（内容相同则跳过写入）。
#   5. 不依赖 SSH：通过 HTTPS sparse-checkout 只拉取 docs/，并支持 --dry-run 预演。
#
# 用法：
#   ./scripts/sync-docs-to-site.sh [--dry-run] [--site <门户站仓库路径>]
#
# 环境变量（可选，优先级低于命令行参数）：
#   SITE_REPO   门户站仓库根目录（默认：与本仓库同级的 GeezCo.github.io）
#
set -euo pipefail

# ---------- 参数解析 ----------
DRY_RUN=0
SITE_REPO="${SITE_REPO:-}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run) DRY_RUN=1; shift ;;
    --site)    SITE_REPO="$2"; shift 2 ;;
    -h|--help)
      grep -E '^#( |$)' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
      exit 0 ;;
    *) echo "未知参数: $1" >&2; exit 2 ;;
  esac
done

# ---------- 路径与常量 ----------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GZDOC_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# 门户站仓库：命令行 > 环境变量 > 默认同级目录
if [[ -z "$SITE_REPO" ]]; then
  SITE_REPO="$(cd "$GZDOC_ROOT/.." && pwd)/GeezCo.github.io"
fi

DOCS_SUBDIR="src/content/docs/gzDoc"
SITE_DOCS_DIR="$SITE_REPO/$DOCS_SUBDIR"

# 白名单：源文件(相对 gzDoc/docs) : 目标文件(相对 SITE_DOCS_DIR) : order
# order 值沿用站点现有配置，保持导航顺序不变。
WHITELIST=(
  "architecture/README.md|architecture/README.md|11"
  "architecture/platform-plugin-architecture.md|architecture/platform-plugin-architecture.md|13"
  "deployment/README.md|deployment/README.md|22"
  "deployment/ENVIRONMENTS.md|deployment/ENVIRONMENTS.md|21"
  "development/README.md|development/README.md|31"
  "workspace-guide.md|workspace-guide.md|6"
)

# ---------- 预检 ----------
log()  { printf '%s\n' "$*"; }
warn() { printf '⚠️  %s\n' "$*" >&2; }
die()  { printf '❌ %s\n' "$*" >&2; exit 1; }

[[ -d "$GZDOC_ROOT/docs" ]] || die "找不到 gzDoc docs 目录: $GZDOC_ROOT/docs"
[[ -d "$SITE_REPO" ]] || die "找不到门户站仓库: $SITE_REPO
请先克隆：git clone https://github.com/GeezCo/GeezCo.github.io.git \"$SITE_REPO\""
[[ -d "$SITE_DOCS_DIR" ]] || die "找不到站点文档目录: $SITE_DOCS_DIR"

log "📤 gzDoc 文档同步 → 门户站"
log "   源:   $GZDOC_ROOT/docs"
log "   目标: $SITE_DOCS_DIR"
[[ $DRY_RUN -eq 1 ]] && log "   模式: DRY-RUN（只预演，不写文件）"
log ""

# ---------- 核心转换（Python：剥离首标题 + 生成 frontmatter）----------
# 输入：源文件路径、order、目标文件路径（用于判断内容是否变化）
# 输出：写入目标（非 dry-run）或仅打印（dry-run）
render_and_write() {
  local src="$1" order="$2" dst="$3" rel="$4"
  python3 - "$src" "$order" "$dst" "$DRY_RUN" "$rel" <<'PY'
import sys, os, re

src, order, dst, dry_run, rel = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4] == "1", sys.argv[5]
raw = open(src, encoding="utf-8").read()

# 若源文件已有 frontmatter，先剥离（保证幂等，可重复处理曾被同步过的源）
if raw.startswith("---"):
    parts = raw.split("---", 2)
    if len(parts) >= 3:
        raw = parts[2].lstrip("\n")

lines = raw.split("\n")

# 提取并移除第一个一级标题作为 title
title = None
body_start = 0
for i, line in enumerate(lines):
    if line.startswith("# "):
        title = line[2:].strip()
        body_start = i + 1
        break
    if line.strip() and not line.startswith("#"):
        break  # 首个非空非标题行前出现正文，说明没有标题
if title is None:
    title = os.path.splitext(os.path.basename(src))[0]

# 跳过标题后的空行
while body_start < len(lines) and lines[body_start].strip() == "":
    body_start += 1
body = "\n".join(lines[body_start:]).rstrip() + "\n"

# 读取既有目标文件，优先复用其已手写的 description（避免用自动提取值覆盖好描述）
old_content = open(dst, encoding="utf-8").read() if os.path.exists(dst) else None
existing_desc = None
if old_content and old_content.startswith("---"):
    fm = old_content.split("---", 2)[1]
    m = re.search(r"^description:\s*(.*)$", fm, re.MULTILINE)
    if m:
        existing_desc = m.group(1).strip()


def extract_description(text):
    """从正文提取一句描述：跳过围栏代码块、ASCII 图、标题/列表/引用/表格等。"""
    in_code = False
    for line in text.split("\n"):
        t = line.strip()
        if t.startswith("```") or t.startswith("~~~"):
            in_code = not in_code
            continue
        if in_code or not t:
            continue
        if t.startswith(("#", "-", "*", ">", "|", "!", "<", "=")):
            continue
        # 跳过含制表/框线字符的 ASCII 图行
        if any(ch in t for ch in "┌┐└┘├┤┬┴┼─│╔╗╚╝║═║↓↑→←"):
            continue
        # 至少包含一个中文字符或字母的普通句子才采用
        if re.search(r"[一-鿿A-Za-z]", t):
            return t[:120]
    return None


if existing_desc:
    description = existing_desc
else:
    description = extract_description(body) or title

frontmatter = (
    "---\n"
    f"title: {title}\n"
    f"description: {description}\n"
    f"order: {order}\n"
    "---\n\n"
)
new_content = frontmatter + body

if old_content == new_content:
    print(f"  ⏭️  {rel}: 无变化，跳过")
    sys.exit(0)

if dry_run:
    print(f"  📝 {rel}: 将更新（title=\"{title}\", order={order}）")
    sys.exit(0)

os.makedirs(os.path.dirname(dst), exist_ok=True)
with open(dst, "w", encoding="utf-8") as f:
    f.write(new_content)
print(f"  ✅ {rel}: 已更新（title=\"{title}\", order={order}）")
PY
}

# ---------- 主流程 ----------
changed=0
for entry in "${WHITELIST[@]}"; do
  IFS='|' read -r src_rel dst_rel order <<< "$entry"
  src="$GZDOC_ROOT/docs/$src_rel"
  dst="$SITE_DOCS_DIR/$dst_rel"

  if [[ ! -f "$src" ]]; then
    warn "源文件缺失，跳过: $src_rel"
    continue
  fi

  render_and_write "$src" "$order" "$dst" "$dst_rel"
done

# ---------- 汇总 ----------
log ""
if [[ $DRY_RUN -eq 1 ]]; then
  log "🔍 DRY-RUN 完成。去掉 --dry-run 以实际写入。"
else
  if ( cd "$SITE_REPO" && [[ -n "$(git status --porcelain "$DOCS_SUBDIR")" ]] ); then
    log "📦 站点仓库改动如下："
    ( cd "$SITE_REPO" && git status --short "$DOCS_SUBDIR" )
    log ""
    log "下一步（在门户站仓库执行）："
    log "  git add $DOCS_SUBDIR && git commit -m \"docs: 同步 gzDoc 文档\""
  else
    log "✅ 站点文档已是最新，无需改动。"
  fi
fi
