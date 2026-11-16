#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 手动配置每个文档的描述
const docDescriptions = {
  'index.md': 'GzDoc 是一个企业级智能文档处理平台，基于 AI 的智能文档管理与问答系统',
  'getting-started.md': '本指南将帮助你快速上手 GzDoc 平台',
  'workspace-guide.md': 'GzDoc 工作区隔离方案和使用指南',
  'architecture/README.md': 'GzDoc 系统架构设计文档',
  'architecture/overview.md': 'GzDoc 采用"平台+插件"架构，实现通用能力复用与垂直场景深度定制的平衡',
  'architecture/platform-plugin-architecture.md': 'GzDoc "平台+插件" 架构详细设计说明',
  'deployment/README.md': 'GzDoc 部署指南，包括 Docker、Kubernetes 等多种部署方式',
  'deployment/ENVIRONMENTS.md': 'GzDoc 环境配置说明文档',
  'development/README.md': 'GzDoc 开发指南，包括环境搭建、开发规范等',
};

function updateFrontmatter(filePath, relativePath) {
  const content = fs.readFileSync(filePath, 'utf-8');

  if (!content.startsWith('---')) {
    console.log(`跳过（无 frontmatter）: ${relativePath}`);
    return;
  }

  const parts = content.split('---');
  if (parts.length < 3) {
    console.log(`跳过（frontmatter 格式错误）: ${relativePath}`);
    return;
  }

  const frontmatterText = parts[1];
  const bodyText = parts.slice(2).join('---');

  // 解析 frontmatter
  const lines = frontmatterText.trim().split('\n');
  let title = '';
  let order = 999;

  for (const line of lines) {
    if (line.startsWith('title:')) {
      title = line.substring(6).trim();
    } else if (line.startsWith('order:')) {
      order = parseInt(line.substring(6).trim()) || 999;
    }
  }

  // 使用配置的描述
  const description = docDescriptions[relativePath] || title;

  // 重新生成 frontmatter
  const newFrontmatter = `---
title: ${title}
description: ${description}
order: ${order}
---
`;

  const newContent = newFrontmatter + bodyText;
  fs.writeFileSync(filePath, newContent, 'utf-8');
  console.log(`已更新: ${relativePath}`);
}

// 处理所有文档
const docsDir = path.join(__dirname, '../src/content/docs/gzDoc');

function processDirectory(dir, baseDir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });

  files.forEach((file) => {
    const fullPath = path.join(dir, file.name);
    const relativePath = path.relative(baseDir, fullPath);

    if (file.isDirectory()) {
      processDirectory(fullPath, baseDir);
    } else if (file.name.endsWith('.md')) {
      updateFrontmatter(fullPath, relativePath);
    }
  });
}

console.log('开始更新文档描述...\n');
processDirectory(docsDir, docsDir);
console.log('\n完成！');
