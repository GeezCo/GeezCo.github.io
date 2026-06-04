#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const docsDir = path.join(__dirname, '../src/content/docs/gzDoc');

// 递归处理所有 .md 文件
function processDirectory(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });

  files.forEach((file) => {
    const fullPath = path.join(dir, file.name);

    if (file.isDirectory()) {
      processDirectory(fullPath);
    } else if (file.name.endsWith('.md')) {
      fixMarkdownFile(fullPath);
    }
  });
}

function fixMarkdownFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');

  // 检查是否有 frontmatter
  if (!content.startsWith('---')) {
    console.log(`跳过（无 frontmatter）: ${filePath}`);
    return;
  }

  // 提取 frontmatter 和正文
  const parts = content.split('---');
  if (parts.length < 3) {
    console.log(`跳过（frontmatter 格式错误）: ${filePath}`);
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

  if (!title) {
    title = path.basename(filePath, '.md');
  }

  // 从正文提取描述
  const bodyLines = bodyText.trim().split('\n');
  let description = '';

  for (const line of bodyLines) {
    const trimmed = line.trim();
    // 跳过空行、标题、代码块、列表、命令、路径
    if (trimmed &&
        !trimmed.startsWith('#') &&
        !trimmed.startsWith('```') &&
        !trimmed.startsWith('-') &&
        !trimmed.startsWith('*') &&
        !trimmed.startsWith('|') &&
        !trimmed.startsWith('>') &&
        !trimmed.startsWith('./') &&
        !trimmed.startsWith('/') &&
        !trimmed.startsWith('cd ') &&
        !trimmed.startsWith('npm ') &&
        !trimmed.startsWith('docker ') &&
        trimmed.length > 10) {
      description = trimmed.substring(0, 150);
      break;
    }
  }

  if (!description) {
    description = title;
  }

  // 重新生成 frontmatter
  const newFrontmatter = `---
title: ${title}
description: ${description}
order: ${order}
---
`;

  const newContent = newFrontmatter + bodyText;
  fs.writeFileSync(filePath, newContent, 'utf-8');
  console.log(`已修复: ${filePath}`);
}

// 开始处理
console.log('开始修复文档 frontmatter...\n');
processDirectory(docsDir);
console.log('\n完成！');
