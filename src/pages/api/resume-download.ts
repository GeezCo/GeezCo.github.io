import { createHmac, createHash, createDecipheriv } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";

export const prerender = false;

const SECRET = import.meta.env.SITE_SECRET;

// 从 SITE_SECRET 派生 AES-256 密钥
let aesKey: Buffer | null = null;
function getAesKey(): Buffer {
  if (!aesKey) {
    aesKey = createHash("sha256").update(SECRET).digest();
  }
  return aesKey;
}

function decrypt(encrypted: Uint8Array): Buffer {
  if (encrypted.length < 28) {
    throw new Error("Encrypted file too small");
  }

  // 格式: IV(12) + AuthTag(16) + Ciphertext
  const iv = encrypted.subarray(0, 12);
  const authTag = encrypted.subarray(12, 28);
  const ciphertext = encrypted.subarray(28);

  const decipher = createDecipheriv("aes-256-gcm", getAesKey(), iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

const TOKEN_TTL = 5 * 60 * 1000; // 5 分钟

function verifyToken(token: string): boolean {
  const parts = token.split(":");
  if (parts.length !== 2) return false;

  const [timestampStr, signature] = parts;
  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) return false;

  if (Date.now() - timestamp > TOKEN_TTL) return false;

  const expected = createHmac("sha256", SECRET)
    .update(timestampStr)
    .digest("hex");

  return signature === expected;
}

export async function GET({ request }: { request: Request }) {
  if (!SECRET) {
    return new Response("Not configured", { status: 500 });
  }

  const url = new URL(request.url);
  // 优先从 Authorization header 读取 token，保留 query param fallback
  const headerToken = request.headers.get("Authorization")?.replace("Bearer ", "");
  const token = headerToken ?? url.searchParams.get("token") ?? undefined;
  const lang = url.searchParams.get("lang") || "zh";

  if (!token || !verifyToken(token)) {
    return new Response(JSON.stringify({ error: "Token 无效或已过期" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encFilename = lang === "en" ? "resume-en.pdf.enc" : "resume.pdf.enc";
  const pdfFilename = lang === "en" ? "resume-en.pdf" : "resume.pdf";
  const filePath = path.join(process.cwd(), "src", "private", encFilename);
  let pdfData: Buffer;

  try {
    const encrypted = new Uint8Array(readFileSync(filePath));
    pdfData = decrypt(encrypted);
  } catch (e) {
    console.error("PDF decrypt failed:", e);
    return new Response("PDF file not found", { status: 500 });
  }

  return new Response(new Uint8Array(pdfData), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${pdfFilename}"`,
      "Content-Length": pdfData.length.toString(),
    },
  });
}