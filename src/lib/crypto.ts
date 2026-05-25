import { randomBytes, pbkdf2Sync, createCipheriv } from "node:crypto";

/**
 * 构建时加密 HTML 内容
 * 使用 PBKDF2 从密码派生 AES-256-GCM 密钥
 *
 * 输出格式（嵌入页面用 ":" 分隔的 base64）:
 *   salt(16B) : iv(12B) : authTag(16B) : ciphertext
 */
export function encryptHtml(
  plaintext: string,
  password: string,
): { salt: Buffer; iv: Buffer; authTag: Buffer; ciphertext: Buffer } {
  const salt = randomBytes(16);
  const iv = randomBytes(12);

  const key = pbkdf2Sync(password, salt, 100_000, 32, "sha256");

  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return { salt, iv, authTag, ciphertext };
}

/** 将加密结果序列化为页面嵌入用的字符串 */
export function serializeEncrypted(enc: {
  salt: Buffer;
  iv: Buffer;
  authTag: Buffer;
  ciphertext: Buffer;
}): string {
  return [
    enc.salt.toString("base64"),
    enc.iv.toString("base64"),
    enc.authTag.toString("base64"),
    enc.ciphertext.toString("base64"),
  ].join(":");
}