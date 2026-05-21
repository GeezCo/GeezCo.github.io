#!/usr/bin/env node
/**
 * sync-content.mjs — Obsidian 内容同步脚本
 * 将 WincyBlog 目录中的已发布文章同步到 Astro content collection
 */

import fs from 'fs';
import path from 'path';
import { createHash } from 'node:crypto';
import grayMatter from 'gray-matter';
import slugify from 'slugify';

// 加载配置
const configPath = path.join(process.cwd(), 'sync.config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

const sourceDir = path.resolve(process.cwd(), config.sourceDir);
const targetDir = path.resolve(process.cwd(), config.targetDir);
const vaultRoot = path.resolve(process.cwd(), '..'); // Obsidian Vault 根目录
const imagesDir = path.resolve(process.cwd(), 'public/images');

// 若 sourceDir 不存在（如 Vercel 云端），跳过 sync
if (!fs.existsSync(sourceDir)) {
  console.log('Source directory not found, skipping sync (likely Vercel environment)');
  process.exit(0);
}

// 确保目标目录存在
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// 确保图片目录存在
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

// 已复制的图片（避免重复）
const copiedImages = new Set();

// 检查是否匹配 excludePatterns（文件名 / 通配；SOURCE 当前为扁平目录）
function shouldExclude(filePath) {
  const relPath = path.relative(sourceDir, filePath);
  const filename = path.basename(filePath, '.md');

  for (const pattern of config.excludePatterns) {
    // 子目录名匹配（若日后恢复子文件夹，可用 "配置中心/" 等形式）
    if (pattern.endsWith('/') || pattern.includes('/')) {
      const dirSegment = pattern.replace(/\/$/, '').replace(/^\*\*\//, '');
      if (relPath.split(path.sep).includes(dirSegment)) return true;
    }

    const namePattern = pattern
      .replace(/^\*\*\//, '')
      .replace(/\.md$/i, '')
      .replace(/\*/g, '');
    if (namePattern.length > 0 && filename.includes(namePattern)) return true;

    const exact = pattern.replace(/\*/g, '').replace(/\.md$/i, '');
    if (exact === filename) return true;
  }

  return false;
}

// 预扫描 Vault 中所有图片文件，建立文件名 → 路径映射
function buildImageMap() {
  const imageMap = new Map();
  const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp'];

  function scanDir(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        // 跳过 blog 目录（避免扫描 Astro 工程）
        if (entry.name === 'blog') continue;
        scanDir(fullPath);
      } else {
        const ext = path.extname(entry.name).toLowerCase();
        if (imageExtensions.includes(ext)) {
          imageMap.set(entry.name, fullPath);
        }
      }
    }
  }

  scanDir(vaultRoot);
  return imageMap;
}

const globalImageMap = buildImageMap();

// 复制图片到 public/images/
function copyImage(imageName) {
  if (copiedImages.has(imageName)) return true;

  // 从全局图片映射查找
  const sourceImage = globalImageMap.get(imageName);
  if (sourceImage) {
    const targetImage = path.join(imagesDir, imageName);
    fs.copyFileSync(sourceImage, targetImage);
    copiedImages.add(imageName);
    console.log(`    📷 Copied image: ${imageName}`);
    return true;
  }

  console.log(`    ⚠️ Image not found: ${imageName}`);
  return false;
}

// 转换 Obsidian 内容
function transformContent(body) {
  let transformed = body;

  // 1. 图片链接 ![[image.png]] → ![image](/images/image.png) + 复制图片（先处理，避免被 Wiki Link 匹配）
  transformed = transformed.replace(/!\[\[([^\]]+)\]\]/g, (match, imageName) => {
    copyImage(imageName);
    return `![${imageName}](/images/${imageName})`;
  });

  // 2. Wiki Link [[xxx]] → [xxx](/blog/xxx-slug)
  transformed = transformed.replace(/\[\[([^\]]+)\]\]/g, (match, linkText) => {
    const slug = slugify(linkText, { lower: true, strict: true, locale: 'zh' });
    return `[${linkText}](/blog/${slug})`;
  });

  // 3. Obsidian Callout > [!note] → GitHub alert 风格
  transformed = transformed.replace(/^> \[!(note|tip|warning|danger|info)\]\s*$/gm, '> **$1**');
  transformed = transformed.replace(/^> \[!(note|tip|warning|danger|info)\]\s+/gm, '> **$1** ');

  // 4. {% btn ... %} → 提取 URL 转为链接
  transformed = transformed.replace(/\{%\s*btn\s+([^%]+)\s*%\}/g, (match, btnContent) => {
    // 尝试提取 URL
    const urlMatch = btnContent.match(/(https?:\/\/[^\s]+)/);
    if (urlMatch) {
      const url = urlMatch[1];
      const text = btnContent.replace(url, '').trim() || '原文链接';
      return `[${text}](${url})`;
    }
    return `[${btnContent.trim()}]`;
  });

  // 5. 删除 base: "[[...]]" 行
  transformed = transformed.replace(/^base:\s*"\[\[[^\]]+\]\]"?\s*$/gm, '');

  return transformed;
}

// 处理单个文件
function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const { data, content: body } = grayMatter(content);

  // 检查 frontmatter 条件
  if (data.type !== 'Post' || data.status !== 'Published') {
    return null;
  }

  // 提取元数据
  const title = data.title || path.basename(filePath, '.md');
  const pubDate = data.date || fs.statSync(filePath).mtime;
  const description = data.summary || '';
  const tags = data.tags || [];

  // 生成 slug
  let slug;
  let legacySlug;
  if (data.slug) {
    if (data.slug.startsWith('http')) {
      // 完整 URL，提取 pathname
      try {
        const urlPath = new URL(data.slug).pathname;
        slug = slugify(path.basename(urlPath), { lower: true, strict: true, locale: 'zh' });
        legacySlug = urlPath.replace(/^\/+/, '');
      } catch {
        slug = slugify(title, { lower: true, strict: true, locale: 'zh' });
      }
    } else {
      slug = data.slug;
    }
  } else {
    slug = slugify(title, { lower: true, strict: true, locale: 'zh' });
  }

  // 保证 slug 非空（纯中文等情况下 slugify 偶发得到空串，避免写出 `.md`）
  const slugCandidates = [slug, title, path.basename(filePath, '.md')];
  let resolvedSlug = '';
  for (const c of slugCandidates) {
    resolvedSlug = slugify(String(c || '').trim(), { lower: true, strict: true, locale: 'zh' });
    if (resolvedSlug) break;
  }
  if (!resolvedSlug) {
    resolvedSlug =
      'post-' +
      createHash('sha256').update(path.basename(filePath, '.md'), 'utf8').digest('hex').slice(0, 12);
  }
  slug = resolvedSlug;

  // 转换内容
  const transformedBody = transformContent(body);

  // 构建新 frontmatter
  const newFrontmatter = {
    title,
    description,
    pubDate: pubDate instanceof Date ? pubDate.toISOString() : pubDate,
    tags,
    draft: false,
  };
  if (legacySlug) {
    newFrontmatter.legacySlug = legacySlug;
  }

  // 生成目标文件内容
  const targetContent = grayMatter.stringify(transformedBody, newFrontmatter);
  const targetPath = path.join(targetDir, `${slug}.md`);

  fs.writeFileSync(targetPath, targetContent);
  return { slug, title };
}

// 递归遍历源目录
function walkDir(dir) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkDir(fullPath));
    } else if (entry.name.endsWith('.md')) {
      files.push(fullPath);
    }
  }
  return files;
}

// 执行同步
console.log(`Syncing from: ${sourceDir}`);
const allFiles = walkDir(sourceDir);
const synced = [];

for (const file of allFiles) {
  if (shouldExclude(file)) {
    continue;
  }
  const result = processFile(file);
  if (result) {
    synced.push(result);
    console.log(`  ✓ ${result.title} → ${result.slug}.md`);
  }
}

console.log(`\nSynced ${synced.length} posts to ${targetDir}`);