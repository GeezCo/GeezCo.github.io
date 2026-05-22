#!/usr/bin/env node
// scripts/encrypt-pdf.mjs
// 用法: RESUME_SECRET="xxx" node scripts/encrypt-pdf.mjs
// 从 src/private/ 读取 resume.pdf，输出 resume.pdf.enc 到同目录

import { createHash, randomBytes, createCipheriv } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const SECRET = process.env.RESUME_SECRET;
if (!SECRET) {
  console.error("错误: 请设置 RESUME_SECRET 环境变量");
  process.exit(1);
}

// 从 RESUME_SECRET 派生 256-bit AES 密钥
const key = createHash("sha256").update(SECRET).digest();

function encrypt(inputPath, outputPath) {
  const plaintext = readFileSync(inputPath);

  // 生成随机 IV (12 bytes for GCM)
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);

  // 加密 + 获取 auth tag
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // 格式: IV(12) + AuthTag(16) + Ciphertext
  const output = Buffer.concat([iv, authTag, encrypted]);
  writeFileSync(outputPath, output);

  const kb = (output.length / 1024).toFixed(1);
  console.log(`已加密: ${inputPath} → ${outputPath} (${kb} KB, IV + AuthTag + Ciphertext)`);
}

const privateDir = resolve(__dirname, "..", "src", "private");

try {
  encrypt(resolve(privateDir, "resume.pdf"), resolve(privateDir, "resume.pdf.enc"));
} catch {
  console.warn("跳过: resume.pdf 不存在");
}

try {
  encrypt(resolve(privateDir, "resume-en.pdf"), resolve(privateDir, "resume-en.pdf.enc"));
} catch {
  console.warn("跳过: resume-en.pdf 不存在");
}