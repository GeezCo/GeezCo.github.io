#!/bin/bash
# 加密上传简历脚本
# 用法: ./script/upload-resume.sh <简历文件路径> [commit消息]
#
# 使用项目现有的 Node.js 加密脚本（AES-256-GCM + SITE_SECRET）

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查参数
if [ $# -lt 1 ]; then
    echo -e "${RED}❌ 用法: $0 <简历文件路径> [commit消息]${NC}"
    echo -e "${YELLOW}示例: $0 ~/Downloads/resume.pdf \"更新简历\"${NC}"
    exit 1
fi

RESUME_FILE="$1"
COMMIT_MSG="${2:-更新简历文件}"

# 检查文件是否存在
if [ ! -f "$RESUME_FILE" ]; then
    echo -e "${RED}❌ 文件不存在: $RESUME_FILE${NC}"
    exit 1
fi

# 检查文件类型
if [[ ! "$RESUME_FILE" =~ \.pdf$ ]]; then
    echo -e "${YELLOW}⚠️  警告: 文件不是 PDF 格式${NC}"
    read -p "是否继续？(y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 项目根目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
PRIVATE_DIR="$PROJECT_ROOT/api/private"
ENCRYPT_SCRIPT="$PROJECT_ROOT/api/scripts/encrypt-pdf.mjs"

# 确保 private 目录存在
mkdir -p "$PRIVATE_DIR"

# 检查加密脚本是否存在
if [ ! -f "$ENCRYPT_SCRIPT" ]; then
    echo -e "${RED}❌ 加密脚本不存在: $ENCRYPT_SCRIPT${NC}"
    exit 1
fi

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ 未找到 Node.js，请先安装${NC}"
    exit 1
fi

# 获取文件名
FILENAME=$(basename "$RESUME_FILE")

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}📄 准备上传简历${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "   源文件: ${YELLOW}$RESUME_FILE${NC}"
echo -e "   目标位置: ${YELLOW}$PRIVATE_DIR/$FILENAME${NC}"
echo

# 复制文件到 private 目录
cp "$RESUME_FILE" "$PRIVATE_DIR/$FILENAME"
echo -e "${GREEN}✓ 文件已复制${NC}"

# 检查 .env.local 是否存在 SITE_SECRET
ENV_FILE="$PROJECT_ROOT/.env.local"
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}❌ 未找到 .env.local 文件${NC}"
    echo -e "${YELLOW}💡 请创建 .env.local 并设置 SITE_SECRET${NC}"
    exit 1
fi

if ! grep -q "SITE_SECRET" "$ENV_FILE"; then
    echo -e "${RED}❌ .env.local 中未找到 SITE_SECRET${NC}"
    echo -e "${YELLOW}💡 请在 .env.local 中添加: SITE_SECRET=your_secret_key${NC}"
    exit 1
fi

# 使用 Node.js 加密脚本（AES-256-GCM）
echo
echo -e "${YELLOW}🔐 开始加密（使用 AES-256-GCM + SITE_SECRET）...${NC}"

# 加载环境变量并执行加密
cd "$PROJECT_ROOT/api"
source "$ENV_FILE"
export SITE_SECRET

node scripts/encrypt-pdf.mjs

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ 加密完成: ${FILENAME}.enc${NC}"

    # 删除未加密的原文件
    if [ -f "$PRIVATE_DIR/$FILENAME" ]; then
        rm "$PRIVATE_DIR/$FILENAME"
        echo -e "${GREEN}✓ 原文件已删除（仅保留加密版本）${NC}"
    fi
else
    echo -e "${RED}❌ 加密失败${NC}"
    exit 1
fi

# Git 操作
cd "$PROJECT_ROOT"

echo
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}📦 Git 操作${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# 检查 git 状态
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${RED}❌ 不是 Git 仓库${NC}"
    exit 1
fi

# 添加加密文件
ENCRYPTED_FILE="api/private/${FILENAME}.enc"
git add "$ENCRYPTED_FILE"
echo -e "${GREEN}✓ 已添加到 Git: ${FILENAME}.enc${NC}"

# 确保原文件在 .gitignore 中
if ! grep -q "api/private/.*\.pdf$" "$PROJECT_ROOT/.gitignore" 2>/dev/null; then
    echo "" >> "$PROJECT_ROOT/.gitignore"
    echo "# 简历原文件（仅提交加密版本）" >> "$PROJECT_ROOT/.gitignore"
    echo "api/private/*.pdf" >> "$PROJECT_ROOT/.gitignore"
    git add .gitignore
    echo -e "${GREEN}✓ 已更新 .gitignore${NC}"
fi

# 显示当前状态
echo
echo -e "${YELLOW}当前变更:${NC}"
git status --short

# 提交
echo
read -p "是否提交这些变更？(Y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    git commit -m "$COMMIT_MSG"
    echo -e "${GREEN}✓ 已提交: $COMMIT_MSG${NC}"

    # 询问是否推送
    echo
    read -p "是否推送到远程仓库？(Y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        git push
        echo -e "${GREEN}✓ 已推送到远程${NC}"
    fi
fi

echo
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 完成！${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}💡 加密文件位置:${NC} $ENCRYPTED_FILE"
echo -e "${YELLOW}💡 加密方式:${NC} AES-256-GCM (使用 SITE_SECRET)"
echo -e "${YELLOW}💡 解密方式:${NC} 使用项目的解密 API 或脚本"

