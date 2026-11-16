#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const docsDir = path.join(__dirname, '../src/content/docs/gzDoc');

// 递归处理所有 .md 文件
function processDirectory(dir, baseOrder = 0) {
  const files = fs.readdirSync(dir, { withFileTypes: true });

  files.forEach((file, index) => {
    const fullPath = path.join(dir, file.name);

    if (file.isDirectory()) {
      processDirectory(fullPath, baseOrder + (index + 1) * 10);
    } else if (file.name.endsWith('.md')) {
      processMarkdownFile(fullPath, baseOrder + index + 1);
    }
  });
}

function processMarkdownFile(filePath, order) {
  const content = fs.readFileSync(filePath, 'utf-8');

  // 检查是否已有 frontmatter
  if (content.startsWith('---')) {
    console.log(`跳过（已有 frontmatter）: ${filePath}`);
    return;
  }

  // 提取标题（第一个 # 标题）
  const titleMatch = content.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1] : path.basename(filePath, '.md');

  // 提取描述（第一段非标题、非代码块的文字）
  const lines = content.split('\n');
  let description = '';
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('```') && !trimmed.startsWith('-') && !trimmed.startsWith('*')) {
      description = trimmed.substring(0, 100);
      break;
    }
  }
  if (!description) {
    description = title;
  }

  // 生成 frontmatter
  const frontmatter = `---
title: ${title}
description: ${description}
order: ${order}
---

`;

  // 写入文件
  const newContent = frontmatter + content;
  fs.writeFileSync(filePath, newContent, 'utf-8');
  console.log(`已处理: ${filePath} (order: ${order})`);
}

// 开始处理
console.log('开始为文档添加 frontmatter...\n');
processDirectory(docsDir);
console.log('\n完成！');
